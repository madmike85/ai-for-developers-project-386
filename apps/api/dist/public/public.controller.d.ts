import { PublicService } from './public.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class PublicController {
    private readonly publicService;
    constructor(publicService: PublicService);
    findAllEventTypes(): Promise<{
        id: string;
        name: string;
        description: string | null;
        durationMinutes: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findAvailableSlots(eventTypeId: string, date: string): Promise<{
        startTime: string;
        endTime: string;
        isAvailable: boolean;
    }[]>;
    createBooking(data: CreateBookingDto): Promise<{
        eventType: {
            id: string;
            name: string;
            description: string | null;
            durationMinutes: number;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        eventTypeId: string;
        guestName: string;
        guestEmail: string;
        startTime: Date;
        endTime: Date;
    }>;
}
