import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// 检查是否配置了Supabase
export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);

// 数据存储路径（服务端使用）
const DATA_DIR = "/tmp/zang-ai-data";
const getFilePath = (table: string) => path.join(DATA_DIR, `${table}.json`);

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getSupabaseClient(token?: string): SupabaseClient {
  if (!hasSupabaseConfig) {
    return createMockClient() as any;
  }
  
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

// 查询构建器
class MockQueryBuilder {
  private table: string;
  private filters: Array<{ field: string; op: string; value: any }> = [];
  private orderField: string | null = null;
  private orderAsc: boolean = true;
  private limitCount: number | null = null;
  private offsetCount: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  private getData(): any[] {
    try {
      if (typeof window !== 'undefined') {
        // 客户端：使用localStorage
        const stored = localStorage.getItem(`zang_${this.table}`);
        return stored ? JSON.parse(stored) : [];
      } else {
        // 服务端：使用文件系统
        ensureDataDir();
        const filePath = getFilePath(this.table);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(content);
        }
        return [];
      }
    } catch {
      return [];
    }
  }

  private saveData(data: any[]) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`zang_${this.table}`, JSON.stringify(data));
      } else {
        ensureDataDir();
        const filePath = getFilePath(this.table);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error(`Failed to save ${this.table}:`, err);
    }
  }

  private executeQuery(): any[] {
    let data = this.getData();
    
    // 应用过滤
    for (const f of this.filters) {
      if (f.op === 'eq') {
        data = data.filter((item: any) => item[f.field] === f.value);
      } else if (f.op === 'neq') {
        data = data.filter((item: any) => item[f.field] !== f.value);
      } else if (f.op === 'gte') {
        data = data.filter((item: any) => {
          const itemVal = item[f.field];
          if (itemVal === null || itemVal === undefined) return false;
          // 字符串比较（支持ISO日期格式）
          if (typeof itemVal === 'string' && typeof f.value === 'string') {
            return itemVal >= f.value;
          }
          return itemVal >= f.value;
        });
      } else if (f.op === 'lte') {
        data = data.filter((item: any) => {
          const itemVal = item[f.field];
          if (itemVal === null || itemVal === undefined) return false;
          if (typeof itemVal === 'string' && typeof f.value === 'string') {
            return itemVal <= f.value;
          }
          return itemVal <= f.value;
        });
      }
    }
    
    // 应用排序
    if (this.orderField) {
      data.sort((a: any, b: any) => {
        const aVal = a[this.orderField!];
        const bVal = b[this.orderField!];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (typeof aVal === 'string') {
          return this.orderAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return this.orderAsc ? aVal - bVal : bVal - aVal;
      });
    }
    
    // 应用分页
    if (this.offsetCount !== null) {
      data = data.slice(this.offsetCount);
    }
    if (this.limitCount !== null) {
      data = data.slice(0, this.limitCount);
    }
    
    return data;
  }

  select(_fields?: string) {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ field, op: 'neq', value });
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push({ field, op: 'gte', value });
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push({ field, op: 'lte', value });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(start: number, end: number) {
    this.offsetCount = start;
    this.limitCount = end - start + 1;
    return this;
  }

  single() {
    const data = this.executeQuery();
    const item = data[0];
    return Promise.resolve({ data: item || null, error: item ? null : { message: 'Not found' } });
  }

  then(resolve: (result: any) => any) {
    const data = this.executeQuery();
    return resolve({ data, error: null });
  }

  insert(data: any | any[]) {
    const items = Array.isArray(data) ? data : [data];
    const self = this;
    const insertOperation = {
      select: () => ({
        single: async () => {
          const existing = self.getData();
          const newItems = items.map(item => ({
            ...item,
            id: item.id || crypto.randomUUID(),
            created_at: item.created_at || new Date().toISOString(),
          }));
          existing.push(...newItems);
          self.saveData(existing);
          return { data: newItems[0], error: null };
        },
      }),
      // 支持 await insert() 直接调用
      then: async (resolve: (result: any) => any) => {
        const existing = self.getData();
        const newItems = items.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          created_at: item.created_at || new Date().toISOString(),
        }));
        existing.push(...newItems);
        self.saveData(existing);
        return resolve({ data: newItems, error: null });
      },
    };
    return insertOperation;
  }

  update(data: any) {
    return {
      eq: async (field: string, value: any) => {
        const items = this.getData();
        const index = items.findIndex((item: any) => item[field] === value);
        if (index >= 0) {
          items[index] = { ...items[index], ...data };
          this.saveData(items);
          return { data: items[index], error: null };
        }
        return { data: null, error: { message: 'Not found' } };
      },
    };
  }

  delete() {
    return {
      eq: async (field: string, value: any) => {
        const items = this.getData();
        const filtered = items.filter((item: any) => item[field] !== value);
        this.saveData(filtered);
        return { error: null };
      },
    };
  }
}

// 模拟客户端（当没有配置Supabase时使用）
function createMockClient() {
  return {
    from: (table: string) => new MockQueryBuilder(table),
    rpc: async () => ({ data: null, error: null }),
  };
}
