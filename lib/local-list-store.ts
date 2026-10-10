import type { ListStore } from "./list-store";
import type { ListItem, MediaListEntry } from "./types";

export const LOCAL_LIST_KEY = "guest-list:v1";

interface LocalListData {
  version: 1;
  items: Record<string, ListItem>;
}

function emptyData(): LocalListData {
  return { version: 1, items: {} };
}

export function readLocalList(): LocalListData {
  try {
    const raw = localStorage.getItem(LOCAL_LIST_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as LocalListData;
    return parsed && parsed.version === 1 && parsed.items ? parsed : emptyData();
  } catch {
    return emptyData();
  }
}

function writeLocalList(data: LocalListData) {
  try {
    localStorage.setItem(LOCAL_LIST_KEY, JSON.stringify(data));
  } catch {
    throw new Error("Couldn't save on this device (storage full or disabled).");
  }
}

export function localListItems(): ListItem[] {
  return Object.values(readLocalList().items);
}

export function clearLocalList() {
  try {
    localStorage.removeItem(LOCAL_LIST_KEY);
  } catch {
    // nothing to clear
  }
}

export function removeLocalItem(mediaId: number) {
  const data = readLocalList();
  delete data.items[String(mediaId)];
  writeLocalList(data);
}

function toEntry(item: ListItem): MediaListEntry {
  return {
    id: item.id,
    mediaId: item.mediaId,
    status: item.status,
    score: item.score,
    progress: item.progress,
    updatedAt: item.updatedAt,
  };
}

/** Guest list kept in localStorage; the local entry id is the media id. */
export const localListStore: ListStore = {
  kind: "local",

  async getEntry(mediaId) {
    const item = readLocalList().items[String(mediaId)];
    return item ? toEntry(item) : null;
  },

  async getCollection(type) {
    return localListItems().filter((item) => item.media.type === type);
  },

  async save({ mediaId, status, score, progress, media }) {
    const data = readLocalList();
    const existing = data.items[String(mediaId)];
    const snapshot = media ?? existing?.media;
    if (!snapshot) {
      throw new Error("Missing media details for local save");
    }
    const item: ListItem = {
      id: mediaId,
      mediaId,
      status,
      score: score && score > 0 ? Math.min(100, Math.round(score)) : null,
      progress: progress != null ? Math.max(0, Math.round(progress)) : null,
      updatedAt: Math.floor(Date.now() / 1000),
      media: snapshot,
    };
    data.items[String(mediaId)] = item;
    writeLocalList(data);
    return toEntry(item);
  },

  async remove(entry) {
    removeLocalItem(entry.mediaId);
  },
};
