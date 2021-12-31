import { NextApiRequest, NextApiResponse } from "next";

import { Readable } from 'stream';
import Stripe from "stripe";
import { stripe } from "../../services/stripe";

async function buffer(readable: Readable) {
    const chunks = [];

    for await (const chunk of readable) {
        chunks.push(
            typeof chunk === "string" ? Buffer.from(chunk) : chunk
        );
    }

    return Buffer.concat(chunks);
}

export const config = {
    api: {
        bodyParse: false
    }
}

const relevantEvents = new Set([
    'checkout.session.completed'
])

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse ) => {
	if (req.method === 'POST') {
        const buf = await buffer(req);
        console.log("---------------------------------------------------")
        // console.log(req)
        console.log("---------------------------------------------------")

        const secret = req.headers['stripe-signature'];

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(req.body, secret, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (error) {
            console.log(`❌ Error message: ${error.message}`);
            return res.status(400).send(`Webhook error: ${error.message}`);
        }

        const type = event.type;

        if (relevantEvents.has(type)) {
            console.log('Evento recebido', type);
        }
        
        res.json( { received: true } );
    }else {
        res.setHeader('Allow', 'POST');
		res.status(405).end('Method not allowed');
    }
}