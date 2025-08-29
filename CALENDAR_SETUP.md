# Calendar Setup Guide

## Overview
The calendar tab has been added to your dashboard with full event and reminder management capabilities.

## Features
- **Events**: Create, edit, and delete calendar events with dates, times, locations, and reminders
- **Reminders**: Set task reminders with priority levels and completion tracking
- **Multiple Views**: Month, week, and day view modes
- **Responsive Design**: Works on both desktop and mobile devices
- **User Isolation**: Each user can only see and manage their own events and reminders

## Database Setup

### 1. Run the SQL Script
Copy and paste the contents of `calendar-setup.sql` into your Supabase SQL editor and run it.

This will create:
- `calendar_events` table for storing events
- `calendar_reminders` table for storing reminders
- Row Level Security policies for user isolation
- Indexes for optimal performance
- Automatic timestamp updates

### 2. Verify Tables
After running the SQL, you should see:
- Two new tables in your database
- Row Level Security enabled on both tables
- Policies that restrict users to only their own data

## Usage

### Adding Events
1. Click the "Add Event" button
2. Fill in the event details:
   - Title (required)
   - Description (optional)
   - Start date and time (required)
   - End date and time (optional)
   - All-day event toggle
   - Location (optional)
   - Reminder settings
3. Click "Create Event"

### Adding Reminders
1. Click the "Add Reminder" button
2. Fill in the reminder details:
   - Title (required)
   - Description (optional)
   - Due date and time (required)
   - Priority level (low/medium/high)
3. Click "Create Reminder"

### Managing Items
- **Edit**: Click the edit icon on any event or reminder
- **Delete**: Click the trash icon to remove items
- **Complete Reminders**: Check the checkbox to mark reminders as complete
- **View Details**: Click on any date to see all events and reminders for that day

### Calendar Navigation
- Use the calendar component to navigate between dates
- Switch between month, week, and day views using the toggle buttons
- Click on any date to select it and view its details

## Security Features
- **Row Level Security**: Users can only access their own data
- **Authentication Required**: Must be logged in to use calendar features
- **Data Isolation**: Events and reminders are completely private to each user

## Technical Details
- Built with React and TypeScript
- Uses TanStack Query for data management
- Integrates with your existing Supabase setup
- Follows the same design patterns as other dashboard components
- Responsive design with Tailwind CSS

## Troubleshooting

### Common Issues
1. **"Table doesn't exist"**: Make sure you've run the SQL setup script
2. **"Permission denied"**: Check that Row Level Security is enabled and policies are created
3. **Events not showing**: Verify you're logged in and the user ID is being set correctly

### Database Verification
You can verify the setup by running these queries in Supabase:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('calendar_events', 'calendar_reminders');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('calendar_events', 'calendar_reminders');
```

## Future Enhancements
Potential features that could be added:
- Recurring events
- Event categories/tags
- Calendar sharing between users
- Email notifications
- Calendar export/import
- Integration with external calendar services

## Support
If you encounter any issues:
1. Check the browser console for error messages
2. Verify the database setup is complete
3. Ensure you're logged in to the dashboard
4. Check that the calendar tab appears in the navigation
