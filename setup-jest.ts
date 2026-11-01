import 'jest-preset-angular/setup-jest';

/**
 * ResizeObserver is a web API for browsers that we is used with `Tabs` component.
 * Jest is Node.js based, hence ResizeObserver is not avaialble. To by pass this issue, we can either use a polyfill or
 * we can create a mock resize observer and assign it as a global variable
 */
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

/**
 * jsdom ne fournit pas crypto.randomUUID (utilisé par l'analytics et les
 * identifiants de corrélation) : on branche l'implémentation de Node.
 */
const testCrypto: any = (globalThis as any).crypto ?? {};
if (!(globalThis as any).crypto) {
	Object.defineProperty(globalThis, 'crypto', { value: testCrypto, configurable: true });
}
if (typeof testCrypto.randomUUID !== 'function') {
	// Format UUID v4, suffisant pour des identifiants de test.
	Object.defineProperty(testCrypto, 'randomUUID', {
		configurable: true,
		value: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
		}),
	});
}
