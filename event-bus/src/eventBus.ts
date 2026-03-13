// eventBus.ts

/**
 * EventMap constrains an event bus to a known set of events and their
 * payload types. Define your app's events as an interface:
 *
 *   interface AppEvents {
 *     "user:logout":   void
 *     "cart:updated":  { itemCount: number }
 *     "toast:show":    { message: string; level: "info" | "error" }
 *   }
 *
 *   const bus = new EventBus<AppEvents>()
 *   bus.on("cart:updated", ({ itemCount }) => updateBadge(itemCount))
 *   bus.emit("cart:updated", { itemCount: 3 })
 */
export type EventMap = Record<string, unknown>

export type Listener<T> = T extends void ? () => void : (payload: T) => void

type ListenerSet<T> = Set<Listener<T>>

export class EventBus<Events extends EventMap> {
    private listeners = new Map<keyof Events, ListenerSet<unknown>>()

    /**
     * Subscribe to an event.
     * Returns an unsubscribe function — call it to remove the listener.
     *
     *   const unsub = bus.on("toast:show", handler)
     *   // later:
     *   unsub()
     */
    on<K extends keyof Events>(
        event: K,
        listener: Listener<Events[K]>
    ): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)!.add(listener as Listener<unknown>)
        return () => this.off(event, listener)
    }

    /**
     * Subscribe to an event exactly once.
     * The listener is automatically removed after the first invocation.
     */
    once<K extends keyof Events>(
        event: K,
        listener: Listener<Events[K]>
    ): () => void {
        const wrapper = ((payload: Events[K]) => {
            unsub()
            ;(listener as (p: Events[K]) => void)(payload)
        }) as Listener<Events[K]>

        const unsub = this.on(event, wrapper)
        return unsub
    }

    /** Remove a specific listener. */
    off<K extends keyof Events>(
        event: K,
        listener: Listener<Events[K]>
    ): void {
        this.listeners.get(event)?.delete(listener as Listener<unknown>)
    }

    /**
     * Emit an event, invoking all registered listeners synchronously.
     * For `void` events (no payload), omit the second argument.
     */
    emit<K extends keyof Events>(
        ...args: Events[K] extends void ? [event: K] : [event: K, payload: Events[K]]
    ): void {
        const [event, payload] = args
        this.listeners.get(event)?.forEach(fn => {
            try {
                (fn as (p: unknown) => void)(payload)
            } catch (e) {
                console.error(`EventBus: listener for "${String(event)}" threw an error`, e)
            }
        })
    }

    /** Remove all listeners for a given event, or all listeners if no event given. */
    clear(event?: keyof Events): void {
        if (event !== undefined) {
            this.listeners.delete(event)
        } else {
            this.listeners.clear()
        }
    }

    /** Returns the number of listeners registered for an event. */
    listenerCount(event: keyof Events): number {
        return this.listeners.get(event)?.size ?? 0
    }
}
