import { Session } from './session';

class ExecutableSession extends Session {
    public async shutdown(): Promise<void> {
        await super.shutdown();

        if (!this._isServer && typeof process !== 'undefined' && process.exit) {
            setTimeout(() => process.exit(0), 100);
        }
    }
}

ExecutableSession.run(ExecutableSession);
