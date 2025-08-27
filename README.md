# VibePay demo

## 📦 Installation

1. Install dependencies:
   ```sh
   npm install
   ```
2. Set up environment variables:

   ```sh
   cp .env.example .env
   ```

   Fill in the necessary values in the `.env` file.

3. Set up the database:

   ```sh
   npx prisma migrate dev
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

## 🚀 Usage

- Run `npm run dev` to start the development server.
- Use `npx prisma studio` to manage your database visually.