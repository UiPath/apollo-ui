/**
 * A static class that provides methods for storing and retrieving content using IndexedDB.
 * The storage is organized with two databases: one for conversations and one for messages.
 */

import type { AutopilotChatMessage } from '../types/AutopilotChatModel';
import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatInternalEvent,
} from '../types/AutopilotChatModel';
import type { AutopilotChatService } from './chat-service';
import { CHAT_ACTIVE_CONVERSATION_ID_KEY } from './constants';
import { StorageService } from './storage';

interface Conversation {
    id: string;
    name: string;
    timestamp: string;
    lastUpdated: number;
}

interface Message extends AutopilotChatMessage {
    conversationId: string;
}

export class LocalHistoryService {
    /** Base name of the conversations database */
    private static CONVERSATIONS_DB_BASE_NAME = 'autopilot_conversations_db';
    /** Base name of the messages database */
    private static MESSAGES_DB_BASE_NAME = 'autopilot_messages_db';
    /** Current version of the database schema */
    private static DB_VERSION = 1;

    private static ACTIVE_CONVERSATION_ID: string | null = null;
    /** Name of the conversations database */
    private static CONVERSATIONS_DB_NAME: string = '';
    /** Name of the messages database */
    private static MESSAGES_DB_NAME: string = '';

    private static UNSUBSCRIBE_CALLBACKS: Map<string, () => void> = new Map();

    /**
     * Gets a connection to the conversations database.
     */
    private static async getConversationsDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(LocalHistoryService.CONVERSATIONS_DB_NAME, LocalHistoryService.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('conversations')) {
                    db.createObjectStore('conversations');
                }
            };
        });
    }

    /**
     * Gets a connection to the messages database.
     */
    private static async getMessagesDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(LocalHistoryService.MESSAGES_DB_NAME, LocalHistoryService.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('messages')) {
                    db.createObjectStore('messages');
                }
            };
        });
    }

    /**
     * Creates a new conversation.
     */
    public static async createConversation(conversationId: string, conversationName: string): Promise<string> {
        const db = await LocalHistoryService.getConversationsDb();
        const conversation = await LocalHistoryService.getConversation(conversationId);

        if (conversation) {
            return conversationId;
        }

        const data = {
            id: conversationId,
            name: conversationName,
            timestamp: new Date().toISOString(),
            lastUpdated: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction('conversations', 'readwrite');
            const store = transaction.objectStore('conversations');
            const request = store.put(data, conversationId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(conversationId);
        });
    }

    /**
     * Gets all conversations.
     */
    public static async getAllConversations(): Promise<Array<{
        id: string;
        name: string;
        timestamp: string;
    }>> {
        const db = await LocalHistoryService.getConversationsDb();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction('conversations', 'readonly');
            const store = transaction.objectStore('conversations');
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    /**
     * Gets a specific conversation.
     */
    public static async getConversation(conversationId: string): Promise<Conversation | null> {
        const db = await LocalHistoryService.getConversationsDb();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction('conversations', 'readonly');
            const store = transaction.objectStore('conversations');
            const request = store.get(conversationId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    /**
     * Saves a message to a conversation.
     */
    public static async saveMessage(conversationId: string, message: AutopilotChatMessage): Promise<string> {
        const db = await LocalHistoryService.getMessagesDb();
        const data = {
            conversationId,
            ...message,
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction('messages', 'readwrite');
            const store = transaction.objectStore('messages');
            const request = store.put(data, `${conversationId}_${message.id}`);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(message.id);
        });
    }

    /**
     * Patches an existing message by appending new content to it.
     * Used primarily for streaming messages where chunks are sent progressively.
     */
    public static async patchMessage(conversationId: string, message: AutopilotChatMessage): Promise<string | null> {
        const db = await LocalHistoryService.getMessagesDb();
        const messageKey = `${conversationId}_${message.id}`;

        // First retrieve the existing message
        const existingMessage = await new Promise<Message | undefined>((resolve, reject) => {
            const transaction = db.transaction('messages', 'readonly');
            const store = transaction.objectStore('messages');
            const request = store.get(messageKey);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });

        // If message doesn't exist, return null
        if (!existingMessage) {
            return null;
        }

        // Append the new content to the existing content and merge all other properties
        const data = {
            ...existingMessage,
            ...message,
            content: `${existingMessage.content}${message.content}`,
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction('messages', 'readwrite');
            const store = transaction.objectStore('messages');
            const request = store.put(data, messageKey);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(message.id);
        });
    }

    /**
     * Gets all messages for a conversation.
     */
    public static async getConversationMessages(conversationId: string): Promise<AutopilotChatMessage[]> {
        const db = await LocalHistoryService.getMessagesDb();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction('messages', 'readonly');
            const store = transaction.objectStore('messages');
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const messages = request.result
                    .filter((msg: Message) => msg.conversationId === conversationId)
                    .sort((a, b) => {
                        const timestampA = new Date(a.created_at).getTime();
                        const timestampB = new Date(b.created_at).getTime();

                        return timestampA - timestampB;
                    });

                resolve(messages);
            };
        });
    }

    /**
     * Deletes a conversation and all associated messages for a conversation.
     */
    public static async deleteConversation(conversationId: string): Promise<void> {
        const conversationsDb = await LocalHistoryService.getConversationsDb();
        const messagesDb = await LocalHistoryService.getMessagesDb();

        return new Promise((resolve, reject) => {
            // Delete the conversation from the conversations database
            const conversationTransaction = conversationsDb.transaction('conversations', 'readwrite');
            const conversationStore = conversationTransaction.objectStore('conversations');
            const conversationRequest = conversationStore.delete(conversationId);

            conversationRequest.onerror = () => reject(conversationRequest.error);

            // Delete all messages associated with the conversation
            const messagesTransaction = messagesDb.transaction('messages', 'readwrite');
            const messagesStore = messagesTransaction.objectStore('messages');

            // Get all messages to find the ones with matching conversationId
            const getAllRequest = messagesStore.getAll();

            getAllRequest.onerror = () => reject(getAllRequest.error);
            getAllRequest.onsuccess = () => {
                const messages = getAllRequest.result;
                const deletePromises: Array<Promise<void>> = [];

                // Delete each message with the matching conversationId
                messages.forEach((msg: Message) => {
                    if (msg.conversationId === conversationId) {
                        deletePromises.push(
                            new Promise<void>((resolveDelete, rejectDelete) => {
                                const deleteRequest = messagesStore.delete(`${conversationId}_${msg.id}`);
                                deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
                                deleteRequest.onsuccess = () => resolveDelete();
                            }),
                        );
                    }
                });

                // Resolve the main promise when all deletions are complete
                Promise.all(deletePromises)
                    .then(() => resolve())
                    .catch((error) => reject(error));
            };
        });
    }

    /**
     * Initializes the local history service.
     */
    public static async Initialize(instanceName: string, chatService: AutopilotChatService) {
        const internalService = chatService.__internalService__;

        // Set instance name and database names
        LocalHistoryService.CONVERSATIONS_DB_NAME = `${instanceName}_${LocalHistoryService.CONVERSATIONS_DB_BASE_NAME}`;
        LocalHistoryService.MESSAGES_DB_NAME = `${instanceName}_${LocalHistoryService.MESSAGES_DB_BASE_NAME}`;

        const cleanup = () => {
            LocalHistoryService.UNSUBSCRIBE_CALLBACKS.forEach((callback) => callback());
            LocalHistoryService.UNSUBSCRIBE_CALLBACKS.clear();
        };

        const handleLocalHistoryChange = async (useLocalHistory: boolean) => {
            if (useLocalHistory) {
                LocalHistoryService.ACTIVE_CONVERSATION_ID = StorageService.Instance.get(CHAT_ACTIVE_CONVERSATION_ID_KEY);

                const unsubscribeSetHistory = chatService.on(AutopilotChatEvent.SetHistory, async () => {
                    if (LocalHistoryService.ACTIVE_CONVERSATION_ID) {
                        chatService.openConversation(LocalHistoryService.ACTIVE_CONVERSATION_ID);
                        chatService.setConversation(
                            await LocalHistoryService.getConversationMessages(LocalHistoryService.ACTIVE_CONVERSATION_ID),
                        );
                    }
                });

                chatService.setHistory(await LocalHistoryService.getAllConversations());

                const handleNewMessage = async (message: AutopilotChatMessage) => {
                    LocalHistoryService.ACTIVE_CONVERSATION_ID = StorageService.Instance.get(CHAT_ACTIVE_CONVERSATION_ID_KEY);

                    if (LocalHistoryService.ACTIVE_CONVERSATION_ID) {
                        await LocalHistoryService.saveMessage(LocalHistoryService.ACTIVE_CONVERSATION_ID, message);
                    } else {
                        LocalHistoryService.ACTIVE_CONVERSATION_ID = crypto.randomUUID();

                        await LocalHistoryService.createConversation(
                            LocalHistoryService.ACTIVE_CONVERSATION_ID,
                            message.content.slice(0, 50),
                        );

                        StorageService.Instance.set(CHAT_ACTIVE_CONVERSATION_ID_KEY, LocalHistoryService.ACTIVE_CONVERSATION_ID);
                        await LocalHistoryService.saveMessage(LocalHistoryService.ACTIVE_CONVERSATION_ID, message);

                        chatService.setHistory(await LocalHistoryService.getAllConversations());
                    }

                    return false;
                };

                const handleChunk = async (message: AutopilotChatMessage) => {
                    LocalHistoryService.ACTIVE_CONVERSATION_ID = StorageService.Instance.get(CHAT_ACTIVE_CONVERSATION_ID_KEY);

                    if (LocalHistoryService.ACTIVE_CONVERSATION_ID) {
                        const result = await LocalHistoryService.patchMessage(LocalHistoryService.ACTIVE_CONVERSATION_ID, message);

                        if (result === null) {
                            await LocalHistoryService.saveMessage(LocalHistoryService.ACTIVE_CONVERSATION_ID, message);
                        }
                    } else {
                        handleNewMessage(message);
                    }
                };

                const unsubscribeRequest = chatService.intercept(AutopilotChatInterceptableEvent.Request, handleNewMessage);
                const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, handleNewMessage);
                const unsubscribeSendChunk = chatService.on(AutopilotChatEvent.SendChunk, handleChunk);
                const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, async () => {
                    LocalHistoryService.ACTIVE_CONVERSATION_ID = null;
                    StorageService.Instance.remove(CHAT_ACTIVE_CONVERSATION_ID_KEY);
                });

                const unsubscribeDeleteConversation = chatService.on(AutopilotChatEvent.DeleteConversation, async (id) => {
                    await LocalHistoryService.deleteConversation(id);

                    if (LocalHistoryService.ACTIVE_CONVERSATION_ID === id) {
                        LocalHistoryService.ACTIVE_CONVERSATION_ID = null;
                        StorageService.Instance.remove(CHAT_ACTIVE_CONVERSATION_ID_KEY);
                    }

                    chatService.setHistory(await LocalHistoryService.getAllConversations());
                });

                const unsubscribeOpenConversation = chatService.on(AutopilotChatEvent.OpenConversation, async (id) => {
                    LocalHistoryService.ACTIVE_CONVERSATION_ID = id;
                    StorageService.Instance.set(CHAT_ACTIVE_CONVERSATION_ID_KEY, id);
                    chatService.setConversation(await LocalHistoryService.getConversationMessages(id));
                });

                cleanup();
                LocalHistoryService.UNSUBSCRIBE_CALLBACKS.set('setHistory', unsubscribeSetHistory);
                LocalHistoryService.UNSUBSCRIBE_CALLBACKS.set('openConversation', unsubscribeOpenConversation);
                LocalHistoryService.UNSUBSCRIBE_CALLBACKS.set('deleteConversation', unsubscribeDeleteConversation);
                LocalHistoryService.UNSUBSCRIBE_CALLBACKS.set('request', unsubscribeRequest);
                LocalHistoryService.UNSUBSCRIBE_CALLBACKS.set('response', unsubscribeResponse);
                LocalHistoryService.UNSUBSCRIBE_CALLBACKS.set('sendChunk', unsubscribeSendChunk);
                LocalHistoryService.UNSUBSCRIBE_CALLBACKS.set('newChat', unsubscribeNewChat);
            } else {
                chatService.setHistory([]);
            }
        };

        if (chatService.getConfig().useLocalHistory) {
            handleLocalHistoryChange(true);
        }

        internalService.on(AutopilotChatInternalEvent.UseLocalHistory, handleLocalHistoryChange);
    }
}
