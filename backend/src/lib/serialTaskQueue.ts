export class SerialTaskQueue {
    private pending: Array<{
        task: () => Promise<unknown>;
        resolve: (value: unknown) => void;
        reject: (reason: unknown) => void;
    }> = [];
    private active = 0;
    private outstanding = 0;

    constructor(private readonly maxConcurrent = 1, private readonly maxOutstanding = 20) {
    }

    run<T>(task: () => Promise<T>) {
        if (this.outstanding >= this.maxOutstanding)
            return Promise.reject(new Error("The isolated runner queue is full. Keep working in the browser and retry after queued jobs finish."));
        this.outstanding += 1;
        return new Promise<T>((resolve, reject) => {
            this.pending.push({ task, resolve: resolve as (value: unknown) => void, reject });
            this.drain();
        });
    }

    status() {
        return { active: this.active, queued: this.pending.length, outstanding: this.outstanding, maxConcurrent: this.maxConcurrent, maxOutstanding: this.maxOutstanding };
    }

    private drain() {
        while (this.active < this.maxConcurrent && this.pending.length > 0) {
            const next = this.pending.shift()!;
            this.active += 1;
            void next.task().then(next.resolve, next.reject).finally(() => {
                this.active -= 1;
                this.outstanding -= 1;
                this.drain();
            });
        }
    }
}
