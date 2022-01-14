import * as vscode from 'vscode';
import { Session } from './session';

export class CmsisDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    async resolveDebugConfigurationWithSubstitutedVariables(_folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration): Promise<vscode.DebugConfiguration> {

        if (process.env.DEBUG_SERVER) {
            debugConfiguration.debugServer = parseInt(process.env.DEBUG_SERVER);
        }

        return debugConfiguration;
    }
}

export class DebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {
    createDebugAdapterDescriptor(_session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        if (process.env.DEBUG_INLINE) {
            // Create inline adapter
            return new vscode.DebugAdapterInlineImplementation(new Session());
        }

        // Use standard runtime specified in package.json
        return executable;
    }
}

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.debug.registerDebugConfigurationProvider('delaying-debug-adapter', new CmsisDebugConfigurationProvider()),
        vscode.debug.registerDebugAdapterDescriptorFactory('delaying-debug-adapter', new DebugAdapterFactory()),
    );
}
