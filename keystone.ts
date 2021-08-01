import { createAuth } from '@keystone-next/auth';
import { config, createSchema } from '@keystone-next/keystone/schema';
import { withItemData, statelessSessions } from '@keystone-next/keystone/session';

import { User } from './schemas/User';
import { Product } from './schemas/Product';
import { ProductImage } from './schemas/ProductImage';
import { insertSeedData } from './seed-data';

import 'dotenv/config';

const databaseURL = process.env.DATABASE_URL;

const sessionConfig = {
    maxAge: 60 * 60 * 24 * 360,
    secret: 'ABCDEFGH1234567887654321HGFEDCBA', // to be changed to env secret
};

const { withAuth } = createAuth({
    listKey: 'User',
    identityField: 'email',
    secretField: 'password',
    initFirstItem: {
        fields: ['name', 'email', 'password'],
    }
});

export default withAuth(config({
    server: {
        cors: {
            origin: [process.env.FRONTEND_URL],
            credentials: true,
        }
    },
    db: {
        adapter: 'mongoose',
        url: databaseURL,
        async onConnect(keystone) {
            console.log('MongoDB connected...!');
            if (process.argv.includes('--seed-data')) {
                await insertSeedData(keystone);
            }
        },
    },
    lists: createSchema({
        User,
        Product,
        ProductImage
    }),
    ui: {
        isAccessAllowed: ({ session }) => !!session?.data,
    },
    session: withItemData(statelessSessions(sessionConfig), {
        User: 'id',
    }),
}));