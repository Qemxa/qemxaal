import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

// Self-contained types to avoid pathing issues with frontend types
interface Vehicle {
  vin: string;
  brand: string;
  model: string;
  year: number;
}

enum MessageRole {
  USER = "user",
  AI = "ai"
}

interface Message {
  role: MessageRole;
  content: string;
  imageUrl?: string;
}

interface PartnerProfile {
    id: string;
    name: string;
    type: 'service' | 'parts';
    description: string;
    products: { name: string; oemNumber: string; }[];
    services: { name: string; }[];
}

interface RequestBody {
    vehicle: Vehicle;
    messages: Message[];
    useGoogleSearch: boolean;
    partnerProfiles: PartnerProfile[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
const model = "gemini-2.5-flash-preview-04-17";

const createSystemInstruction = (vehicle: Vehicle, partnerProfiles: PartnerProfile[]): string => {
    let instruction = `შენ ხარ QEMXA, ექსპერტი AI ავტო-დიაგნოსტი. შენი მიზანია დაეხმარო მომხმარებლებს მანქანის პრობლემების იდენტიფიცირებაში. იყავი თავაზიანი, პროფესიონალი და დეტალური.
მომხმარებლის მანქანა არის: ${vehicle.year} ${vehicle.brand} ${vehicle.model}.

შენი პასუხი დააბრუნე შემდეგი სტრუქტურით, ქართულ ენაზე:
**პრობლემის შეჯამება:** (მოკლედ შეაჯამე მომხმარებლის მიერ აღწერილი პრობლემა)
**სავარაუდო დიაგნოზი:** (ჩამოთვალე პრობლემის რამდენიმე სავარაუდო მიზეზი, დაწყებული ყველაზე სავარაუდოთი.)
**რეკომენდაციები:** (მიეცი კონკრეტული, ნაბიჯ-ნაბიჯ რჩევები. რა უნდა შეამოწმოს მომხმარებელმა? როდის არის აუცილებელი ხელოსანთან მისვლა?)
`;

    if (partnerProfiles && partnerProfiles.length > 0) {
        const partnerInfo = partnerProfiles.map(p => `- ${p.name} (${p.type === 'service' ? 'სერვისი' : 'ნაწილები'}): ${p.description}`).join('\n');
        instruction += `
თუ მომხმარებლის პრობლემა ეხება კონკრეტულ ნაწილს ან სერვისს და შენთვის მოწოდებულ პარტნიორების სიაში არის შესაბამისი შეთავაზება, აუცილებლად ახსენე რეკომენდაციებში. მაგალითად: 'ამ პრობლემის მოსაგვარებლად შეგიძლიათ მიმართოთ ჩვენს პარტნიორს: [პარტნიორის სახელი].'

ხელმისაწვდომი პარტნიორები:
${partnerInfo}`;
    }
    return instruction;
};

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    if (!process.env.API_KEY) {
        console.error('API_KEY environment variable is not set.');
        return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
    }

    try {
        const { vehicle, messages, useGoogleSearch, partnerProfiles } = JSON.parse(event.body || '{}') as RequestBody;

        if (!vehicle || !messages) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing vehicle or messages in request body.' }) };
        }

        const systemInstruction = createSystemInstruction(vehicle, partnerProfiles);

        const contents = messages.map(msg => {
            const parts: Part[] = [];
            if (msg.content) {
                parts.push({ text: msg.content });
            }
            if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
                const match = msg.imageUrl.match(/^data:(image\/\w+);base64,(.*)$/);
                if (match) {
                    parts.push({
                        inlineData: { mimeType: match[1], data: match[2] },
                    });
                }
            }
            return {
                role: msg.role === MessageRole.AI ? 'model' : 'user',
                parts,
            };
        });

        const config: any = {
            systemInstruction,
        };
        if (useGoogleSearch) {
            config.tools = [{ googleSearch: {} }];
        }
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents,
            config,
        });

        const text = response.text;
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const sources = groundingMetadata?.groundingChunks
            ?.map(chunk => chunk.web)
            .filter(web => web && web.uri) || [];

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, sources }),
        };

    } catch (error) {
        console.error('Error in getAiResponse function:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get AI response from the service.' }) };
    }
};

export { handler };