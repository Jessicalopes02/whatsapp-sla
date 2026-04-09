import { env } from "../../config/env";
import fetch from "node-fetch";

export class TimelineIAService {
  private apiUrl: string = env.API_URL;
  private apiToken: string = env.API_TOKEN;

  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: "5511999999999",
          text: "Teste conexão Timeline IA",
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro Timeline IA:", error);
      throw new Error("Erro ao conectar com Timeline IA");
    }
  }
}