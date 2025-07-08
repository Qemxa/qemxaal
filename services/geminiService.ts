import { Message, Vehicle, GroundingSource, PartnerProfile } from '../types';

interface AiResponse {
  text: string;
  sources: GroundingSource[];
}

export const getAiResponse = async (vehicle: Vehicle, messages: Message[], useGoogleSearch: boolean, partnerProfiles: PartnerProfile[]): Promise<AiResponse> => {
    try {
        const response = await fetch('/api/getAiResponse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vehicle,
                messages,
                useGoogleSearch,
                partnerProfiles
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown server error occurred.' }));
            console.error('AI Service Error:', errorData);
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        return {
            text: data.text || '',
            sources: data.sources || [],
        };
    } catch (error) {
        console.error('Failed to get AI response:', error);
        const errorMessage = `ბოდიში, AI ასისტენტთან დაკავშირება ვერ მოხერხდა. მიზეზი: ${error instanceof Error ? error.message : 'უცნობი შეცდომა'}. გთხოვთ, სცადოთ მოგვიანებით.`;
        return { text: errorMessage, sources: [] };
    }
};
