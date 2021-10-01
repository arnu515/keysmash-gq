import { writable } from "svelte/store";

export interface Notification {
  id: string;
  title?: string;
  message: string;
  type: "danger" | "success" | "warning";
}

const notifications = (() => {
  const { set, subscribe, update } = writable<Notification[]>([]);

  return {
    subscribe,
    notify: (notif: Omit<Notification, "id"> | string) => {
      if (typeof notif === "string")
        update(n => [
          ...n,
          {
            message: notif,
            type: "danger",
            id: Date.now.toString()
          }
        ]);
      else update(n => [...n, { ...notif, id: Date.now().toString() }]);
    },
    clear: set([]),
    dismiss: (id: string) => {
      update(n => n.filter(i => i.id !== id));
    },
    set,
    update
  };
})();

export default notifications;
