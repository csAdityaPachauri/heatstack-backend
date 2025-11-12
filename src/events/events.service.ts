import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ClickEventData, CreateEventDto, EventType, HoverEventData, ViewEventData } from './dto';
import { Points, User, UserDocument } from './schemas/user.schema';
import { Stack, StackDocument } from './schemas/stack.schema';
import { EmbeddingService } from '../vectordb/embedding.service';
import { VectordbService } from '../vectordb/vectordb.service';
import { EventTransformerService } from '../vectordb/transformers/event-transformer.service';
import { CreateFlowDto } from './dto/create-flow.dto';

@Injectable()
export class EventsService {
  constructor(
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
    const allStacks = await this.stackModel.find({}).exec();
    let website = stack.websites.find(website => website.origin === origin);
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

  async flows(stackId: string, origin: string, createFlowDto: CreateFlowDto): Promise<any> {
    console.log('flows', stackId, origin, createFlowDto);
    const stack = await this.stackModel.findOne({ id: stackId });
    if (!stack) {
      return {
        success: false,
        message: 'Stack not found',
      }
    }
    if(!stack.websites) {
      stack.websites = [];
    }
    const website = stack.websites.find(website => website.origin === origin);
    if (!website) {
      return {
        success: false,
        message: 'Website not found',
      }
    }
    const allCollections = await this.connection.db.collections();
    const websiteCollection = allCollections.find(collection => collection.collectionName === `${origin}.collection`);
    if (!websiteCollection) {
      return {
        success: false,
        message: 'Website collection not found',
      }
    }
    const flow = {
      id: createFlowDto.id,
      name: createFlowDto.name,
      sequence: createFlowDto.sequence,
    }
    stack.websites = [...stack.websites.map(website => {
      if(website.origin !== origin) return website;
      if(!website.flows) {
        website = {
          ...website,
          flows: {
            [flow.id]: flow,
          },
        };
      }
      else {
        website = {
          ...website,
          flows: {
            ...website.flows,
            [flow.id]: flow,
          },
        };
      }
      return website;
    })];
    await stack.save();
    return {
      success: true,
      flow,
    }
  }

  async getFlow(stackId: string, origin: string, flowId: string): Promise<any> {
    const stack = await this.stackModel.findOne({ id: stackId });
    if (!stack) {
      return {
        success: false,
        message: 'Stack not found',
      }
    }
    if(!stack.websites) {
      stack.websites = [];
    }
    const website = stack.websites.find(website => website.origin === origin);
    if (!website) {
      return {
        success: false,
        message: 'Website not found',
      }
    }
    const allCollections = await this.connection.db.collections();
    const websiteCollection = allCollections.find(collection => collection.collectionName === `${origin}.collection`);
    if (!websiteCollection) {
      return {
        success: false,
        message: 'Website collection not found',
      }
    }
    if(!website.flows) {
      return {
        success: false,
        message: 'Flow not found',
      }
    }
    const flow = website.flows[flowId];
    if(!flow) {
      return {
        success: false,
        message: 'Flow not found',
      }
    }
    const users = await websiteCollection.find({}).toArray();
    let totalInteractedUsers = 0;
    const results = [];
    for(let i = 1; i < flow.sequence.length; i++) {
      const node = flow.sequence[i];
      const previousNode = flow.sequence[i - 1];
      const usersInteractedWithPreviousNode = users.filter(user => user.points[previousNode]?.click.length > 0);
      if(i === 1) {
        totalInteractedUsers = usersInteractedWithPreviousNode.length;
      }
      const usersInteractedWithNode = users.filter(user => user.points[node]?.click.length > 0);
      const usersInteractedWithNodesUids = usersInteractedWithNode.map(user => user.id);

      const commonUsers = usersInteractedWithPreviousNode.filter(user => usersInteractedWithNodesUids.includes(user.id));
      let validUsers = 0;
      commonUsers.forEach(user => {
        const previousNodeInteractions = user.points[previousNode].click.sort();
        const currentNodeInteractions = user.points[node].click.sort();

        let isValidTransition = false;
        currentNodeInteractions.forEach(currentInteraction => {
          if(isValidTransition) return;
          isValidTransition = previousNodeInteractions.some(previousInteraction => previousInteraction < currentInteraction);
        });

        if(isValidTransition) {
          validUsers++;
        }
      })
      results.push(validUsers);
    }
    return {
      success: true,
      users: totalInteractedUsers,
      results,
    }
  }
}
