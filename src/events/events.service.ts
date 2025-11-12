import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ClickEventData, CreateEventDto, EventType, HoverEventData, ViewEventData } from './dto';
import { Points, User, UserDocument } from './schemas/user.schema';
import { Stack, StackDocument } from './schemas/stack.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Stack.name) private stackModel: Model<StackDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async createWebsiteCollection(origin: string) {
    return await this.connection.db.createCollection<UserDocument>(`${origin}.collection`);
  }

  async create(stackId: string, userId: string, origin: string, createEventDtos: CreateEventDto[]): Promise<any> {
    let stack = await this.stackModel.findOne({ id: stackId });
    if (!stack) {
      stack = await this.stackModel.create({
        id: stackId,
        websites: [{
          origin,
          flows: {},
        }],
      });
      await stack.save();
    }
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
    let websiteCollection = allCollections.find(collection => collection.collectionName === `${origin}.collection`);
    if (!websiteCollection) {
      await this.createWebsiteCollection(origin);
    }
    allCollections = await this.connection.db.collections();
    websiteCollection = allCollections.find(collection => collection.collectionName === `${origin}.collection`);

    let user = await websiteCollection.findOne({ id: userId });
    if (!user) {
      const points: Points = createEventDtos.reduce((acc, event) => {
        if(typeof acc[event.cslp] === 'undefined') {
          acc[event.cslp] = {
            view: 0,
            click: [],
            hover: 0,
          };
        }
        if(event.type === EventType.VIEW) {
          acc[event.cslp].view += (event.data as ViewEventData).duration;
        } else if(event.type === EventType.CLICK) {
          acc[event.cslp].click.push((event.data as ClickEventData).timestamp);
        } else if(event.type === EventType.HOVER) {
          acc[event.cslp].hover += (event.data as HoverEventData).duration;
        }
        return acc;
      }, {} as Points);
      await websiteCollection.insertOne({
        id: userId,
        points,
      });
      user = await websiteCollection.findOne({ id: userId });
      return {
        success: true,
      }
    }
    let existingPoints = user.points;
    const points: Points = createEventDtos.reduce((acc, event) => {
      if(typeof acc[event.cslp] === 'undefined') {
        acc[event.cslp] = {
          view: 0,
          click: [],
          hover: 0,
        };
      }
      if(event.type === EventType.VIEW) {
        acc[event.cslp].view += (event.data as ViewEventData).duration;
      } else if(event.type === EventType.CLICK) {
        acc[event.cslp].click.push((event.data as ClickEventData).timestamp);
      } else if(event.type === EventType.HOVER) {
        acc[event.cslp].hover += (event.data as HoverEventData).duration;
      }
      return acc;
    }, existingPoints);
    await websiteCollection.updateOne({ id: userId }, { $set: { points } });
    user = await websiteCollection.findOne({ id: userId });
    return {
      success: true,
    }
  }

  async events(stackId: string, origin: string): Promise<any> {
    let stack = await this.stackModel.findOne({ id: stackId });
    if (!stack) {
      return {
        success: false,
        message: 'Stack not found',
      }
    }
    let website = stack.websites.find(website => website.origin === origin);
    if (!website) {
      return {
        success: false,
        message: 'Website not found',
      }
    }
    let allCollections = await this.connection.db.collections();
    let websiteCollection = allCollections.find(collection => collection.collectionName === `${origin}.collection`);
    if (!websiteCollection) {
      return {
        success: false,
        message: 'Website collection not found',
      }
    }
    const userData = await websiteCollection.find({}).project({ points: 1, id: 1 }).toArray();
    return {
      success: true,
      userData,
    }
  }
}
