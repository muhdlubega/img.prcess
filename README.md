# IMG.prcess

A powerful AI-powered document processing application that extracts structured data from document images using Mistral's Pixtral-12b vision model. Upload document images, extract data with confidence scores, and export to Excel or PDF formats.

## Features

- **AI-Powered Extraction**: Uses Mistral's Pixtral-12b-2409 model for intelligent document data extraction
- **Confidence Scoring**: Each extracted field includes an accuracy percentage with visual indicators
- **Multiple Export Formats**: Export extracted data to Excel (.xlsx) or PDF formats
- **Document History**: Save and manage extracted documents with searchable sidebar
- **Dark Mode**: Beautiful dark mode interface with light mode toggle
- **Responsive Design**: Mobile-friendly with collapsible sidebar navigation
- **IP-Based Storage**: Automatically tracks and stores documents by user IP using Supabase
- **Real-time Processing**: Live processing status with animated indicators

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **AI Model**: Mistral Pixtral-12b-2409 via @mistralai/mistralai
- **Database**: Supabase (PostgreSQL)
- **Export Libraries**: 
  - xlsx for Excel export
  - jsPDF for PDF export

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- A Mistral AI API key

## Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Mistral AI Configuration
   MISTRAL_API_KEY=your_mistral_api_key
   ```

   **Where to find these values:**
   - Supabase credentials: Project Settings > API in your Supabase dashboard
   - Mistral API key: [Mistral AI Console](https://console.mistral.ai/)

## Database Setup

1. **Connect to your Supabase project**

2. **Run the initial database setup**

   Open the Supabase SQL Editor and run the script from `scripts/setup-database.sql`

3. **Run the migration script**

   If you already have an existing table, run the migration script from `scripts/migrate-add-missing-columns.sql` to add any missing columns

   The database schema includes:
   - `extracted_documents` table with columns for:
     - Document name
     - Extracted fields (JSONB)
     - Confidence scores (JSONB)
     - Total accuracy percentage
     - Raw extracted text
     - User IP tracking
     - Timestamps

## Running the Application

1. **Development mode**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Production build**
   ```bash
   npm run build
   npm start
   ```

## Usage Guide

### Uploading Documents

1. Click the upload area or drag and drop document images (PNG, JPG, JPEG, WebP)
2. The AI will automatically process the document and extract structured data
3. View extracted fields with individual confidence scores
4. See the total accuracy percentage in the top-right circular indicator

### Saving Documents

1. Enter a document name in the input field
2. Click "Save Data" to store the extracted information
3. Documents are automatically associated with your IP address

### Viewing Saved Documents

1. Open the sidebar (hamburger menu on mobile)
2. Click on any saved document to view its details
3. All extracted data, confidence scores, and raw text are preserved

### Exporting Data

- **Excel Export**: Click "Export to Excel" to download a .xlsx file with all extracted fields
- **PDF Export**: Click "Export to PDF" to download a formatted PDF document

### Copying Raw Text

Click the copy icon in the top-right corner of the raw extracted text section to copy the full text to your clipboard.

### Theme Toggle

Use the theme toggle in the sidebar to switch between dark mode (default) and light mode.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── process-document/    # AI document processing endpoint
│   │   ├── save-data/            # Save extracted data to Supabase
│   │   └── get-history/          # Retrieve user's document history
│   ├── layout.tsx                # Root layout with theme provider
│   ├── page.tsx                  # Main application page
│   └── globals.css               # Global styles and theme tokens
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── document-processor.tsx    # Main document processing component
│   ├── file-upload.tsx           # File upload with drag-and-drop
│   ├── data-display.tsx          # Display extracted data with exports
│   ├── sidebar.tsx               # Document history sidebar
│   ├── theme-provider.tsx        # Dark/light mode management
│   └── processing-status.tsx     # Processing animation
├── lib/
│   ├── supabase-server.ts        # Supabase client configuration
│   └── utils.ts                  # Utility functions
└── scripts/
    ├── setup-database.sql        # Initial database schema
    └── migrate-add-missing-columns.sql  # Migration script
```

## Features in Detail

### AI Document Processing

The application uses Mistral's Pixtral-12b-2409 vision model to:
- Analyze document images
- Extract structured data fields
- Provide confidence scores for each field
- Generate raw text transcription

### Confidence Scoring

- Each extracted field displays an accuracy percentage with a visual progress bar
- Total accuracy is calculated as the average of all field confidences
- Circular progress indicator shows overall extraction quality

### Data Persistence

All extracted documents are stored in Supabase with:
- User IP tracking for privacy-friendly identification
- Full field data with confidence scores
- Raw extracted text for reference
- Timestamps for sorting and filtering

## Troubleshooting

### "Failed to save data" Error

1. Verify Supabase environment variables are set correctly
2. Ensure the database table exists (run setup scripts)
3. Check that all required columns are present (run migration script)
4. Verify Supabase service role key has proper permissions

### "Failed to process document" Error

1. Verify MISTRAL_API_KEY is set correctly
2. Check that the image file is a supported format
3. Ensure the image is not corrupted or too large

### Raw text not showing for saved documents

1. This may occur for documents saved before the raw_text field was added
2. Re-process and save the document to populate the field
