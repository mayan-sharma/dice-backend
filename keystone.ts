import { createAuth } from '@keystone-next/auth';
import { config, createSchema } from '@keystone-next/keystone/schema';
import { withItemData, statelessSessions } from '@keystone-next/keystone/session';

import { User } from './schemas/User';
import { Product } from './schemas/Product';
import { ProductImage } from './schemas/ProductImage';
import { CartItem } from './schemas/CartItem';
import { OrderItem } from './schemas/OrderItem';
import { Order } from './schemas/Order';
import { insertSeedData } from './seed-data';
import { sendEmail } from './lib/mail';
import { extendGraphqlSchema } from './mutations';

import 'dotenv/config';

const databaseURL = process.env.DATABASE_URL;

const sessionConfig = {
    maxAge: 60 * 60 * 24 * 360,
    secret: process.env.SESSION_SECRET,
};

const { withAuth } = createAuth({
    listKey: 'User',
    identityField: 'email',
    secretField: 'password',
    initFirstItem: {
        fields: ['name', 'email', 'password'],
    },
    passwordResetLink: {
        async sendToken(args) {
            await sendEmail(args.token, args.identity);
        }
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
        ProductImage,
        CartItem,
        OrderItem,
        Order
    }),
    extendGraphqlSchema,
    ui: {
        isAccessAllowed: ({ session }) => !!session?.data,
    },
    session: withItemData(statelessSessions(sessionConfig), {
        User: 'id',
    }),
}));