import { JSONArray, JSONObject, JSONPrimitive } from "./json-types";
import "reflect-metadata";

export type Permission = "r" | "w" | "rw" | "none";

export type StoreResult = Store | JSONPrimitive | undefined;

export type StoreValue =
  | JSONObject
  | JSONArray
  | StoreResult
  | (() => StoreResult);

export interface IStore {
  defaultPolicy: Permission;
  allowedToRead(key: string): boolean;
  allowedToWrite(key: string): boolean;
  read(path: string): StoreResult;
  write(path: string, value: StoreValue): StoreValue;
  writeEntries(entries: JSONObject): void;
  entries(): JSONObject;
}

const formatMetadataKey = Symbol("format");

/**
 * Decorator to restrict access to a property based on permissions.
 * @param permission - The permission level ("r", "w", "rw", "none").
 */
export function Restrict(permission?: Permission) {
  return Reflect.metadata(formatMetadataKey, permission);
}

/**
 * Retrieves the permission level for a specific property.
 * @param target - The target object.
 * @param propertyKey - The property name.
 * @returns The permission level or the default policy if not specified.
 */
export function getRestrict(target: any, propertyKey: string): Permission {
  const permission = Reflect.getMetadata(
    formatMetadataKey,
    target,
    propertyKey
  );
  return permission || target.defaultPolicy;
}

export class Store implements IStore {
  defaultPolicy: Permission = "rw";
  [key: string]: any;

  constructor(initialData?: any) {
    if (initialData) {
      Object.assign(this, initialData);
    }
  }

  /**
   * Checks if the key is allowed to be read.
   * @param key - The key to check.
   * @returns True if readable, false otherwise.
   */
  allowedToRead(key: string): boolean {
    const permission =
      this.getNestedPermission(key.split(":")) || this.defaultPolicy;
    return permission === "r" || permission === "rw";
  }

  /**
   * Checks if the key is allowed to be written.
   * @param key - The key to check.
   * @returns True if writable, false otherwise.
   */
  allowedToWrite(key: string): boolean {
    const permission =
      this.getNestedPermission(key.split(":")) || this.defaultPolicy;
    return permission === "w" || permission === "rw";
  }

  /**
   * Reads a value from the store by path.
   * @param path - The path to the value.
   * @returns The value at the path.
   * @throws An error if the read permission is denied.
   */
  read(path: string): StoreResult {
    if (!this.allowedToRead(path)) {
      throw new Error(`Permission denied: Unable to read ${path}`);
    }
    const value = this.getNestedValue(path.split(":"));
    return typeof value === "function" ? (value as Function)() : value;
  }

  /**
   * Writes a value to the store at the specified path.
   * @param path - The path to write to.
   * @param value - The value to write.
   * @returns The written value.
   * @throws An error if the write permission is denied.
   */
  write(path: string, value: StoreValue): StoreValue {
    if (!this.allowedToWrite(path)) {
      throw new Error(`Permission denied: Unable to write to ${path}`);
    }
    this.setNestedValue(path.split(":"), value);
    return value;
  }

  /**
   * Writes multiple entries to the store.
   * @param entries - An object containing key-value pairs to write.
   */
  writeEntries(entries: JSONObject): void {
    for (const [key, value] of Object.entries(entries)) {
      this.write(key, value);
    }
  }

  /**
   * Retrieves all entries in the store that are allowed to be read.
   * @returns An object containing readable key-value pairs.
   */
  entries(): JSONObject {
    return Object.entries(this)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        if (this.allowedToRead(key)) {
          acc[key] = value as JSONObject[keyof JSONObject];
        }
        return acc;
      }, {} as JSONObject);
  }

  /**
   * Retrieves the permission for a nested path in the store.
   * @param path - The path array.
   * @returns The permission level or the default policy if not found.
   */
  private getNestedPermission(path: string[]): Permission {
    if (path.length < 2 || typeof this[path[0]] === "function") {
      return getRestrict(this, path[0]);
    }

    let current: any = this[path[0]];
    let index = 0;
    let permission = this.defaultPolicy;

    while (current) {
      index++;
      permission = path[index] ? getRestrict(current, path[index]) : permission;
      current = current[path[index]];
    }

    return permission;
  }

  /**
   * Retrieves a nested value from the store.
   * @param path - The path array.
   * @returns The nested value or undefined if not found.
   */
  private getNestedValue(path: string[]): StoreResult {
    return path.reduce((acc, key) => {
      if (acc && acc[key] !== undefined && typeof acc !== "function") {
        return acc[key];
      }

      if (acc && typeof acc === "function") {
        const result = (acc as Function)(key);
        if (result instanceof Store) {
          return result.getNestedValue([key]);
        }
        return result(key);
      }

      return undefined;
    }, this);
  }

  /**
   * Sets a nested value in the store.
   * @param path - The path array.
   * @param value - The value to set.
   * @throws An error if the path is invalid.
   */
  private setNestedValue(path: string[], value: StoreValue): void {
    if (path.length === 0) {
      throw new Error("Path cannot be empty");
    }

    const lastKey = path.pop();
    if (!lastKey) {
      throw new Error("Last key is invalid");
    }

    const current = path.reduce((acc: any, key: string) => {
      if (!acc[key]) {
        acc[key] = new Store();
      }

      if (typeof acc[key] === "object" && !acc[key].defaultPolicy) {
        acc[key].defaultPolicy = acc.defaultPolicy;

        const permission = getRestrict(acc[key], key);
        if (!permission) {
          Reflect.defineMetadata(formatMetadataKey, permission, acc[key], key);
        }
      }

      return acc[key];
    }, this);

    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      if (!current[lastKey]) {
        current[lastKey] = new Store();
      }
      for (const [key, val] of Object.entries(value)) {
        current[lastKey].setNestedValue([key], val);
      }
    } else {
      current[lastKey] = value;

      Reflect.defineMetadata(
        formatMetadataKey,
        current.defaultPolicy,
        current,
        lastKey
      );
    }
  }
}
