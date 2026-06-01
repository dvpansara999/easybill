import { getActiveOrGlobalItem, removeActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore";
export function createUserStoreWorkspaceCache() {
    return {
        get(key) {
            return getActiveOrGlobalItem(key);
        },
        set(key, value) {
            setActiveOrGlobalItem(key, value);
        },
        remove(key) {
            removeActiveOrGlobalItem(key);
        },
    };
}
