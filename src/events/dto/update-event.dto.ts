export class UpdateEventDto {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  attendees?: string[];
  maxAttendees?: number;
  status?: 'draft' | 'published' | 'cancelled';
  tags?: string[];
}

