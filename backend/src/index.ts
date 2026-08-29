import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function main() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  const PORT = process.env.PORT ?? 4000;
  app.listen(PORT, () => {
    console.log(`🌤  Backend running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

main().catch(console.error);
