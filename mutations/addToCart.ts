import { KeystoneContext } from "@keystone-next/types";
import { CartItemCreateInput } from '../.keystone/schema-types';
import { Session } from "../types";

export default async function addToCart(
    root: any, 
    { productId }: { productId: string }, 
    context: KeystoneContext
): Promise<CartItemCreateInput> {
    
    const sesh = context.session as Session;

    if (!sesh.itemId) {
        throw new Error('You must be logged in!');
    }

    const allCartItems = await context.lists.CartItem.findMany({
        where: { user: { id: sesh.itemId }, product: { id: productId } },
        resolveFields: 'id, quantity'
    });

    const [existingCartItem] = allCartItems;

    console.log(existingCartItem);

    if (existingCartItem) {
        
        console.log('Item already in cart, incremented quantity');
        
        return await context.lists.CartItem.updateOne({
            id: existingCartItem.id,
            data: { quantity: existingCartItem.quantity + 1 }
        });
    }

    console.log('Item added in cart!');

    return await context.lists.CartItem.createOne({
        data: {
            product: { connect: { id: productId } },
            user: { connect: { id: sesh.itemId } }
        }
    })

}