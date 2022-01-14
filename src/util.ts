export class Deferred<T> {
    private _resolve!: (value: T | PromiseLike<T>) => void;
    private _reject!: (reason?: any) => void;

    public promise = new Promise<T>((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
    });

    public state: 'pending' | 'resolved' | 'rejected' = 'pending';

    public resolve(value: T | PromiseLike<T>): void {
        this.state = 'resolved';
        this._resolve(value);
    }

    public reject(reason?: any): void {
        this.state = 'rejected';
        this._reject(reason);
    }
}
