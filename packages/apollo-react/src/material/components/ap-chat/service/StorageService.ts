export interface Storage {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
    clear(): void;
}

export class StorageService implements Storage {
    private static instance: StorageService;
    private readonly prefix = 'ap-chat-';

    private constructor() {}

    public static get Instance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    public get(key: string): string | null {
        return localStorage.getItem(this.getKey(key));
    }

    public set(key: string, value: string): void {
        localStorage.setItem(this.getKey(key), value);
    }

    public remove(key: string): void {
        localStorage.removeItem(this.getKey(key));
    }

    public clear(): void {
        Object.keys(StorageService)
            .filter(key => key.startsWith(this.prefix))
            .forEach(key => localStorage.removeItem(key));
    }
}
