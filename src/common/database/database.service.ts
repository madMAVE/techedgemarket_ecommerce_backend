import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import type {
  Product, Order, InventoryItem,
  ProcurementOrder, Prospect, ServiceTicket, User
} from "../../common/types";

@Injectable()
export class DatabaseService {
  private store = {
    products: new Map<string, Product>(),
    orders: new Map<string, Order>(),
    inventory: new Map<string, InventoryItem>(),
    procurement: new Map<string, ProcurementOrder>(),
    prospects: new Map<string, Prospect>(),
    tickets: new Map<string, ServiceTicket>(),
    users: new Map<string, User>(),
  };

  // Products
  findAllProducts(): Product[] {
    return Array.from(this.store.products.values());
  }

  findProductById(id: string): Product | undefined {
    return this.store.products.get(id);
  }

  findProductBySku(sku: string): Product | undefined {
    return this.findAllProducts().find(p => p.sku === sku);
  }

  findProductByPartNumber(pn: string): Product | undefined {
    return this.findAllProducts().find(p => p.partNumber === pn);
  }

  createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
    const now = new Date().toISOString();
    const item = { ...data, id: uuid(), createdAt: now, updatedAt: now } as Product;
    this.store.products.set(item.id, item);
    return item;
  }

  updateProduct(id: string, data: Partial<Product>): Product | null {
    const existing = this.store.products.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.products.set(id, updated);
    return updated;
  }

  deleteProduct(id: string): boolean {
    return this.store.products.delete(id);
  }

  productCount(): number {
    return this.store.products.size;
  }

  // Orders
  findAllOrders(): Order[] {
    return Array.from(this.store.orders.values());
  }

  findOrderById(id: string): Order | undefined {
    return this.store.orders.get(id);
  }

  findOrderByNumber(num: string): Order | undefined {
    return this.findAllOrders().find(o => o.orderNumber === num);
  }

  findOrdersByCustomer(cid: string): Order[] {
    return this.findAllOrders().filter(o => o.customerId === cid);
  }

  createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Order {
    const now = new Date().toISOString();
    const item = { ...data, id: uuid(), createdAt: now, updatedAt: now } as Order;
    this.store.orders.set(item.id, item);
    return item;
  }

  updateOrder(id: string, data: Partial<Order>): Order | null {
    const existing = this.store.orders.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.orders.set(id, updated);
    return updated;
  }

  orderCount(): number {
    return this.store.orders.size;
  }

  // Inventory
  findAllInventory(): InventoryItem[] {
    return Array.from(this.store.inventory.values());
  }

  findInventoryById(id: string): InventoryItem | undefined {
    return this.store.inventory.get(id);
  }

  findInventoryByProduct(pid: string): InventoryItem | undefined {
    return this.findAllInventory().find(i => i.productId === pid);
  }

  findLowStock(): InventoryItem[] {
    return this.findAllInventory().filter(i => i.status !== "in_stock");
  }

  updateInventory(id: string, data: Partial<InventoryItem>): InventoryItem | null {
    const existing = this.store.inventory.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.inventory.set(id, updated);
    return updated;
  }

  createInventory(data: Omit<InventoryItem, "id" | "updatedAt">): InventoryItem {
    const item = { ...data, id: uuid(), updatedAt: new Date().toISOString() } as InventoryItem;
    this.store.inventory.set(item.id, item);
    return item;
  }

  // Procurement
  findAllProcurement(): ProcurementOrder[] {
    return Array.from(this.store.procurement.values());
  }

  findProcurementById(id: string): ProcurementOrder | undefined {
    return this.store.procurement.get(id);
  }

  createProcurement(data: Omit<ProcurementOrder, "id" | "createdAt" | "updatedAt">): ProcurementOrder {
    const now = new Date().toISOString();
    const item = { ...data, id: uuid(), createdAt: now, updatedAt: now } as ProcurementOrder;
    this.store.procurement.set(item.id, item);
    return item;
  }

  updateProcurement(id: string, data: Partial<ProcurementOrder>): ProcurementOrder | null {
    const existing = this.store.procurement.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.procurement.set(id, updated);
    return updated;
  }

  // Prospects
  findAllProspects(): Prospect[] {
    return Array.from(this.store.prospects.values());
  }

  findProspectById(id: string): Prospect | undefined {
    return this.store.prospects.get(id);
  }

  createProspect(data: Omit<Prospect, "id" | "createdAt" | "updatedAt">): Prospect {
    const now = new Date().toISOString();
    const item = { ...data, id: uuid(), createdAt: now, updatedAt: now } as Prospect;
    this.store.prospects.set(item.id, item);
    return item;
  }

  updateProspect(id: string, data: Partial<Prospect>): Prospect | null {
    const existing = this.store.prospects.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.prospects.set(id, updated);
    return updated;
  }

  deleteProspect(id: string): boolean {
    return this.store.prospects.delete(id);
  }

  // Tickets
  findAllTickets(): ServiceTicket[] {
    return Array.from(this.store.tickets.values());
  }

  findTicketById(id: string): ServiceTicket | undefined {
    return this.store.tickets.get(id);
  }

  createTicket(data: Omit<ServiceTicket, "id" | "createdAt" | "updatedAt">): ServiceTicket {
    const now = new Date().toISOString();
    const item = { ...data, id: uuid(), createdAt: now, updatedAt: now } as ServiceTicket;
    this.store.tickets.set(item.id, item);
    return item;
  }

  updateTicket(id: string, data: Partial<ServiceTicket>): ServiceTicket | null {
    const existing = this.store.tickets.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.tickets.set(id, updated);
    return updated;
  }

  // Users
  findAllUsers(): User[] {
    return Array.from(this.store.users.values());
  }

  findUserById(id: string): User | undefined {
    return this.store.users.get(id);
  }

  findUserByEmail(email: string): User | undefined {
    return this.findAllUsers().find(u => u.email === email);
  }

  createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    const now = new Date().toISOString();
    const item = { ...data, id: uuid(), createdAt: now, updatedAt: now } as User;
    this.store.users.set(item.id, item);
    return item;
  }

  updateUser(id: string, data: Partial<User>): User | null {
    const existing = this.store.users.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.users.set(id, updated);
    return updated;
  }

  // Seed helpers
  seedProducts(products: Product[]) {
    products.forEach(p => this.store.products.set(p.id, p));
  }

  seedOrders(orders: Order[]) {
    orders.forEach(o => this.store.orders.set(o.id, o));
  }

  seedInventory(items: InventoryItem[]) {
    items.forEach(i => this.store.inventory.set(i.id, i));
  }

  seedProcurement(items: ProcurementOrder[]) {
    items.forEach(p => this.store.procurement.set(p.id, p));
  }

  seedProspects(items: Prospect[]) {
    items.forEach(p => this.store.prospects.set(p.id, p));
  }

  seedTickets(items: ServiceTicket[]) {
    items.forEach(t => this.store.tickets.set(t.id, t));
  }

  seedUsers(users: User[]) {
    users.forEach(u => this.store.users.set(u.id, u));
  }
}
