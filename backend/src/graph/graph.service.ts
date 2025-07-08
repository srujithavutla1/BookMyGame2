import { Injectable, BadRequestException } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import 'isomorphic-fetch';
@Injectable()
export class GraphService {
  constructor(
    
  ) {}

  // Initialize Graph client with access token
  private getGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  // Get user ID by email
  async getUserIdByEmail(accessToken: string, email: string): Promise<string> {
    const client = this.getGraphClient(accessToken);
    try {
      const user = await client.api(`/users/${email}`).get();
      return user.id;
    } catch (error) {
      throw new BadRequestException(`Failed to fetch user ID for ${email}: ${error.message}`);
    }
  }

  // Create or get a 1:1 chat
  async getOrCreateChat(accessToken: string, senderId: string, recipientEmail: string, recipientAccessToken: string): Promise<string> {
    const client = this.getGraphClient(accessToken);
    const recipientId = await this.getUserIdByEmail(recipientAccessToken, recipientEmail);

    // Fetch all one-on-one chats
    const chats = await client.api('/me/chats')
      .filter(`chatType eq 'oneOnOne'`)
      .get();

    // Check each chat's members to find an existing chat with the recipient
    for (const chat of chats.value) {
      try {
        const members = await client.api(`/chats/${chat.id}/members`).get();
        const hasRecipient = members.value.some(member => member.userId === recipientId);
        if (hasRecipient) {
            console.log(chat.id)
          return chat.id;
        }
      } catch (error) {
        console.error(`Error fetching members for chat ${chat.id}: ${error.message}`);
        // Continue to next chat if there's an error fetching members
      }
    }

    // Create a new 1:1 chat if no existing chat is found
    const chat = {
      chatType: 'oneOnOne',
      members: [
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${senderId}')`,
        },
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${recipientId}')`,
        },
      ],
    };

    try {
      const newChat = await client.api('/chats').post(chat);
      return newChat.id;
    } catch (error) {
      throw new BadRequestException(`Failed to create chat: ${error.message}`);
    }
  }

  // Send a message to a chat
  async sendMessage(accessToken: string, chatId: string, message: string): Promise<void> {
  const client = this.getGraphClient(accessToken);
  const chatMessage = {
    body: {
      content: message,
      contentType: 'text',
    },
  };
  console.log(chatMessage);
  try {
    await client.api(`/chats/${chatId}/messages`).post(chatMessage);
  } catch (error) {
    throw new BadRequestException(`Failed to send message: ${error.message}`);
  }
}
}