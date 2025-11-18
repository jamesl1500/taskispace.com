# TaskiSpace - Ultimate Task Management Solution

A modern, feature-rich task management application built with Next.js 15, TypeScript, and Supabase.

## ✨ Features

### 🏢 Workspace Management
- **Create & Organize Workspaces**: Build separate environments for different projects
- **Customizable Appearance**: Set custom colors and icons for each workspace
- **Smart Organization**: Automatic task counting and member tracking

### 📋 Advanced Task Management
- **Full CRUD Operations**: Create, read, update, and delete tasks with ease
- **Status Tracking**: Todo, In Progress, In Review, and Completed states
- **Priority Levels**: Low, Medium, High, and Urgent priority classification
- **Rich Descriptions**: Full text descriptions with formatting support
- **Due Date Management**: Set and track task deadlines
- **Tag System**: Organize tasks with custom tags
- **Assignment System**: Assign tasks to team members

### 🔍 Powerful Filtering & Search
- **Global Search**: Find tasks across all workspaces instantly
- **Multi-Filter Support**: Filter by status, priority, assignee, and more
- **Smart Sorting**: Sort by date, priority, name, or custom criteria
- **Advanced Analytics**: Task completion statistics and progress tracking

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme switching with system preference detection
- **Intuitive Interface**: Clean, modern design using Shadcn/UI components
- **Real-time Updates**: Live task updates across all views
- **Smooth Animations**: Polished interactions and transitions

### 🔐 Security & Authentication
- **Row Level Security (RLS)**: Database-level security with Supabase
- **User Authentication**: Secure login and registration system
- **Access Control**: Workspace-based permission system
- **Data Privacy**: Your data is always private and secure

## 🚀 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Shadcn/UI for consistent design
- **Icons**: Lucide React for beautiful icons
- **State Management**: React Hooks with custom data fetching
- **Form Handling**: React Hook Form with Zod validation

## 📦 Quick Start

### Prerequisites

- Node.js 18+ installed
- pnpm (recommended) or npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/taskispace.com.git
   cd taskispace.com
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase project:
   ```bash
   # Copy the contents of supabase/schema.sql and run it in your Supabase SQL editor
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses a PostgreSQL database with the following main tables:

- **`workspaces`**: Store workspace information and metadata
- **`tasks`**: Store task details with relationships to workspaces
- **`auth.users`**: Supabase authentication users (managed by Supabase)

### Key Features of the Schema:
- **UUID Primary Keys**: For better performance and security
- **Row Level Security (RLS)**: Automatic data isolation per user
- **Automatic Timestamps**: Created/updated timestamps with triggers
- **Foreign Key Constraints**: Data integrity and cascading deletes
- **Optimized Indexes**: Fast queries on common search patterns

## 🛠️ Development

### Project Structure

```
taskispace.com/
├── app/                    # Next.js App Router
│   ├── api/               # API routes for backend functionality
│   │   ├── workspaces/    # Workspace CRUD operations
│   │   └── tasks/         # Task CRUD operations
│   ├── workspaces/        # Workspace management pages
│   ├── tasks/             # Task management pages
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── ui/               # Shadcn/UI components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
├── supabase/             # Database schema and migrations
└── public/               # Static assets
```

### Available Scripts

- `npm dev` - Start development server
- `npm build` - Build for production
- `npm start` - Start production server
- `npm lint` - Run ESLint
- `npm type-check` - Run TypeScript compiler

### API Endpoints

#### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create new workspace
- `GET /api/workspaces/[id]` - Get workspace details
- `PATCH /api/workspaces/[id]` - Update workspace
- `DELETE /api/workspaces/[id]` - Delete workspace

#### Tasks
- `GET /api/tasks` - List all user tasks
- `GET /api/workspaces/[id]/tasks` - List workspace tasks
- `POST /api/workspaces/[id]/tasks` - Create new task
- `GET /api/tasks/[id]` - Get task details
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ |
| `NODE_ENV` | Environment (development/production) | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your app's base URL | ❌ |

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and keys
3. Run the schema from `supabase/schema.sql` in the SQL editor
4. Enable Row Level Security on your tables
5. Configure authentication providers as needed

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms

The app can be deployed to any platform that supports Node.js:

- **Netlify**: Add build command `pnpm build` and publish directory `out`
- **Railway**: Connect GitHub repo and add environment variables
- **DigitalOcean App Platform**: Use Node.js buildpack

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [Wiki](https://github.com/yourusername/taskispace.com/wiki)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/taskispace.com/issues)
- **Discussions**: Join conversations in [GitHub Discussions](https://github.com/yourusername/taskispace.com/discussions)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend-as-a-service
- [Shadcn/UI](https://ui.shadcn.com/) for the beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Lucide](https://lucide.dev/) for the icon library

---

Made with ❤️ by the TaskiSpace team
