import { DebugProtocol } from 'vscode-debugprotocol';
import { DebugSession, InitializedEvent, TerminatedEvent, Event, OutputEvent } from 'vscode-debugadapter';
import { Deferred } from './util';

export interface SessionOptions extends DebugProtocol.LaunchRequestArguments {
    delay: number;
}

// Launch-specific arguments
type LaunchRequestArguments = SessionOptions;

// Attach-specific arguments
type AttachRequestArguments = SessionOptions;

/**
 * Implementation of the ExitedEvent
 */
class ExitedEvent extends Event implements DebugProtocol.ExitedEvent {
    public body: {
        exitCode: number
    };

    public constructor(exitCode: number) {
        super('exited');
        this.body = {
            exitCode
        };
    }
}

/**
 * This class implements the handling of the various requests of the debug adapter protocol.
 */
export class Session extends DebugSession {
    private configuredPromise = new Deferred();

    /**
     * Handler for the 'Initialize' request.
     *
     * See: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_Initialize
     *
     * @param response - The response that will be received by the client
     * @param args - The request arguments that have been passed by the client
     */
    protected async initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): Promise<void> {
        response.body = {
            supportsConditionalBreakpoints: false,
            supportsHitConditionalBreakpoints: false,
            supportsFunctionBreakpoints: true,
            supportsConfigurationDoneRequest: true,
            supportsEvaluateForHovers: false,
            supportsStepBack: false,
            supportsSetVariable: false,
            supportsRestartFrame: false,
            supportsStepInTargetsRequest: false,
            supportsGotoTargetsRequest: false,
            supportsCompletionsRequest: false,
            supportsRestartRequest: true,
            supportsExceptionOptions: false,
            supportsValueFormattingOptions: false,
            supportsExceptionInfoRequest: false,
            supportTerminateDebuggee: false,
            supportsDelayedStackTraceLoading: false,
            supportsLoadedSourcesRequest: false,
            supportsLogPoints: false,
            supportsTerminateThreadsRequest: false,
            supportsSetExpression: false,
            supportsTerminateRequest: true,
            supportsDataBreakpoints: false,
            supportsReadMemoryRequest: true,
            supportsWriteMemoryRequest: true,
        };

        this.sendResponse(response);
        this.sendEvent(new InitializedEvent());
    }

    /**
     * Handler for the 'ConfigurationDone' request.
     *
     * See: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_ConfigurationDone
     *
     * @param response - The response that will be received by the client
     * @param args - The request arguments that have been passed by the client
     */
    protected async configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): Promise<void> {
        // Wait until debugger is configured
        await this.configuredPromise.promise;
        super.configurationDoneRequest(response, args);
    }

    /**
     * Handler for the 'Attach' request.
     *
     * See: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_Attach
     *
     * @param response - The response that will be received by the client
     * @param args - The request arguments that have been passed by the client
     */
    protected async attachRequest(response: DebugProtocol.AttachResponse, args: AttachRequestArguments): Promise<void> {
        try {
            await this.initializeSession(args);
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    /**
     * Handler for the 'Launch' request.
     *
     * See: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_Launch
     *
     * @param response - The response that will be received by the client
     * @param args - The request arguments that have been passed by the client
     */
    protected async launchRequest(response: DebugProtocol.AttachResponse, args: LaunchRequestArguments): Promise<void> {
        try {
            await this.initializeSession(args);
            this.sendResponse(response);
        } catch (err) {
            this.sendErrorResponse(response, 1, err.message);
        }
    }

    /**
     * Common part of the 'Launch' and 'Attach' requests. This function is responsible for opening USB device,
     * initializing the DebugCore, DebugInfo, and Breakpoints instances, and connecting to the target device.
     *
     * @param args - The request arguments that have been passed by the client
     */
    protected async initializeSession(args: SessionOptions): Promise<void> {
        this.log(`Waiting for ${args.delay} ms`);
        await new Promise(resolve => setTimeout(resolve, args.delay));
        this.log('Wait over');

        // Mark configuration done
        this.configuredPromise.resolve(undefined);
    }

    /**
     * Handler for the 'Terminate' request.
     *
     * See: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_Terminate
     *
     * @param response - The response that will be received by the client
     * @param args - The request arguments that have been passed by the client
     */
    protected async terminateRequest(response: DebugProtocol.TerminateResponse, _args: DebugProtocol.TerminateArguments): Promise<void> {
        this.sendResponse(response);
        // Ensure this is waited for to guarantee proper shutdown
        await this.shutdown();
        this.sendEvent(new TerminatedEvent());
    }

    /**
     * Shutdown the debug session
     */
    public async shutdown(): Promise<void> {
        this.sendEvent(new ExitedEvent(0));
    }

    private log(message: any): void {
        this.sendEvent(new OutputEvent(`${message}\n`, 'console'));
    }
}
