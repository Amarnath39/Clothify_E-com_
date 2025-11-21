# SIS E-commerce Stack

This is a full-stack e-commerce application built with Next.js, TypeScript, and MongoDB. It includes features for product management, user authentication, order processing, and an admin dashboard for managing the store.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v20.x or later)
*   npm (v10.x or later)
*   MongoDB (local or cloud-hosted)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/sism-ecom-stack.git
    cd sism-ecom-stack
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the following environment variables:

    ```env
    MONGODB_URI=<your-mongodb-uri>
    JWT_SECRET=<your-jwt-secret>
    NEXT_PUBLIC_API_URL=http://localhost:4000/api
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:4000`.

## Folder Structure

The project follows a standard Next.js folder structure with some additional directories for organizing the codebase:

```
sism-ecom-stack/
├── .next/              # Next.js build output
├── components/         # Shared UI components
├── db/                 # Database connection and models
├── emailTemplate/      # Email templates for notifications
├── invoiceTemplate/    # Templates for generating invoices
├── middleware/         # Custom middleware for authentication and authorization
├── node_modules/       # Project dependencies
├── public/             # Static assets (images, fonts, etc.)
├── src/                # Application source code
│   ├── app/            # Next.js app router
│   ├── apis/           # API-related files
│   ├── components/     # Reusable UI components
│   ├── constants/      # Application constants
│   ├── helper/         # Helper functions and utilities
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Redux store and other libraries
│   ├── model/          # Mongoose models
│   └── ...
├── .gitignore          # Files and folders to ignore in Git
├── next.config.mjs     # Next.js configuration
├── package.json        # Project metadata and dependencies
└── ...
```

## Technologies Used

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/)
*   **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/)
*   **Authentication:** [JWT](https://jwt.io/) and [cookies](https://www.npmjs.com/package/cookie)
*   **API Communication:** [Axios](https://axios-http.com/)
*   **Email:** [Nodemailer](https://nodemailer.com/)
*   **Payment Gateway:** [PhonePe PG SDK](https://developer.phonepe.com/v1/reference/phonepe-pg-sdk-for-nodejs)

## Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the codebase for errors and style issues.

## API Endpoints

The API is organized by feature under the `src/app/api` directory. Each feature has its own folder with the corresponding API routes. For example, the `products` API has routes for creating, reading, updating, and deleting products.

## Deployment

The project can be deployed to any platform that supports Node.js applications, such as Vercel, Netlify, or a custom server. The `deployment.yaml` file in the `.github/workflows` directory provides an example of how to set up a CI/CD pipeline with GitHub Actions.