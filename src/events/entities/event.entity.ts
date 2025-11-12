export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  organizerId: string;
  attendees: string[];
  maxAttendees?: number;
  status: 'draft' | 'published' | 'cancelled';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

