import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ClickEventData, CreateEventDto, EventType, HoverEventData, ViewEventData } from './dto';
import { Points, User, UserDocument } from './schemas/user.schema';
import { Stack, StackDocument } from './schemas/stack.schema';
import { EmbeddingService } from '../vectordb/embedding.service';
import { VectordbService } from '../vectordb/vectordb.service';
import { EventTransformerService } from '../vectordb/transformers/event-transformer.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Stack.name) private stackModel: Model<StackDocument>,
    @InjectConnection() private connection: Connection,
    private embeddingService: EmbeddingService,
    private vectordbService: VectordbService,
    private transformerService: EventTransformerService,
  ) {}

  async createWebsiteCollection(origin: string) {
    return await this.connection.db.createCollection<UserDocument>(`${origin}.collection`);
  }

  async create(
    stackId: string,
    userId: string,
    origin: string,
    createEventDtos: CreateEventDto[],
  ): Promise<any> {
    console.log('data received', stackId, userId, origin, createEventDtos);

    // ORIGINAL MONGODB FLOW - Keep exactly as it was
    let stack = await this.stackModel.findOne({ id: stackId });
    if (!stack) {
      stack = await this.stackModel.create({
        id: stackId,
        websites: [
          {
            origin,
            flows: {},
          },
        ],
      });
      await stack.save();
    }
    let website = stack.websites.find((website) => website.origin === origin);
    if (!website) {
      website = {
        origin,
        flows: {},
      };
      stack.websites.push(website);
      await stack.save();
      await this.createWebsiteCollection(origin);
    }
    let allCollections = await this.connection.db.collections();
    let websiteCollection = allCollections.find(
      (collection) => collection.collectionName === `${origin}.collection`,
    );
    if (!websiteCollection) {
      await this.createWebsiteCollection(origin);
    }
    allCollections = await this.connection.db.collections();
    websiteCollection = allCollections.find(
      (collection) => collection.collectionName === `${origin}.collection`,
    );

    let user = await websiteCollection.findOne({ id: userId });
    let points: Points;

    if (!user) {
      points = createEventDtos.reduce((acc, event) => {
        if (typeof acc[event.cslp] === 'undefined') {
          acc[event.cslp] = {
            view: 0,
            click: [],
            hover: 0,
          };
        }
        if (event.type === EventType.VIEW) {
          acc[event.cslp].view += (event.data as ViewEventData).duration;
        } else if (event.type === EventType.CLICK) {
          acc[event.cslp].click.push((event.data as ClickEventData).timestamp);
        } else if (event.type === EventType.HOVER) {
          acc[event.cslp].hover += (event.data as HoverEventData).duration;
        }
        return acc;
      }, {} as Points);
      await websiteCollection.insertOne({
        id: userId,
        points,
      });
      user = await websiteCollection.findOne({ id: userId });
    } else {
      const existingPoints = user.points;
      points = createEventDtos.reduce((acc, event) => {
        if (typeof acc[event.cslp] === 'undefined') {
          acc[event.cslp] = {
            view: 0,
            click: [],
            hover: 0,
          };
        }
        if (event.type === EventType.VIEW) {
          acc[event.cslp].view += (event.data as ViewEventData).duration;
        } else if (event.type === EventType.CLICK) {
          acc[event.cslp].click.push((event.data as ClickEventData).timestamp);
        } else if (event.type === EventType.HOVER) {
          acc[event.cslp].hover += (event.data as HoverEventData).duration;
        }
        return acc;
      }, existingPoints);
      await websiteCollection.updateOne({ id: userId }, { $set: { points } });
      user = await websiteCollection.findOne({ id: userId });
    }

    // NEW: Vector DB integration - runs AFTER MongoDB storage
    if (points && Object.keys(points).length > 0) {
      try {
        console.log('📝 Transforming events to text for vector storage...');
        const texts = this.transformerService.transformToText(userId, stackId, origin, points);

        if (texts.length > 0) {
          console.log(`🔄 Generating embeddings for ${texts.length} interactions...`);
          const embeddings = await this.embeddingService.generateEmbeddings(texts);

          const vectors = embeddings.map((embedding, index) => {
            const cslp = Object.keys(points)[index];
            const metrics = this.extractMetrics(points[cslp]);

            return {
              id: `${userId}_${stackId}_${Date.now()}_${index}`,
              values: embedding,
              metadata: {
                userId,
                stackId,
                origin,
                cslp,
                eventType: 'aggregated' as const,
                timestamp: Date.now(),
                textContent: texts[index],
                totalClicks: metrics.totalClicks,
                totalViews: metrics.totalViews,
                totalHover: metrics.totalHover,
              },
            };
          });

          console.log(`💾 Storing ${vectors.length} vectors in Pinecone...`);
          await this.vectordbService.upsertBatch(vectors);
          console.log(`✅ Successfully stored vectors in Pinecone!`);
        }
      } catch (error) {
        console.error('❌ Vector DB error (non-blocking):', error.message);
        // Don't fail the request if vector storage fails
      }
    }

    return {
      success: true,
    };
  }

  async events(stackId: string, origin: string): Promise<any> {
    const stack = await this.stackModel.findOne({ id: stackId });
    if (!stack) {
      return {
        success: false,
        message: 'Stack not found',
      };
    }
    const website = stack.websites.find((website) => website.origin === origin);
    if (!website) {
      return {
        success: false,
        message: 'Website not found',
      };
    }
    const allCollections = await this.connection.db.collections();
    const websiteCollection = allCollections.find(
      (collection) => collection.collectionName === `${origin}.collection`,
    );
    if (!websiteCollection) {
      return {
        success: false,
        message: 'Website collection not found',
      };
    }
    const userData = await websiteCollection.find({}).project({ points: 1, id: 1 }).toArray();
    return {
      success: true,
      userData,
    };
  }

  private extractMetrics(interactions: any) {
    return {
      totalClicks: Array.isArray(interactions.click) ? interactions.click.length : 0,
      totalViews: interactions.view || 0,
      totalHover: interactions.hover || 0,
    };
  }
}
