import pb from '@/lib/pocketbase/client'
import {
  BillingConfigResponse,
  CreateCheckoutParams,
  CreateCheckoutResponse,
  SubscriptionItem,
  PaymentItem,
} from '@/types'

export const billingService = {
  /**
   * Obtém as configurações de cobrança (status de configuração da chave, sandbox vs prod, planos)
   */
  async getConfig(): Promise<BillingConfigResponse> {
    const res = await pb.send<BillingConfigResponse>('/backend/v1/billing/config', {
      method: 'GET',
    })
    return res
  },

  /**
   * Inicia o fluxo de checkout seguro no Asaas:
   * Cria o cliente se necessário e cria a assinatura, retornando o checkoutUrl
   */
  async createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResponse> {
    const res = await pb.send<CreateCheckoutResponse>('/backend/v1/billing/create-checkout', {
      method: 'POST',
      body: params,
    })
    return res
  },

  /**
   * Busca as assinaturas do usuário atual
   */
  async getMySubscriptions(): Promise<SubscriptionItem[]> {
    const records = await pb.collection('subscriptions').getFullList({
      sort: '-created',
    })
    return records.map((r: any) => ({
      id: r.id,
      user: r.user,
      plan: r.plan,
      status: r.status,
      price: r.price,
      billing_interval: r.billing_interval,
      current_period_start: r.current_period_start,
      current_period_end: r.current_period_end,
      cancel_at_period_end: r.cancel_at_period_end,
      canceled_at: r.canceled_at,
      trial_end: r.trial_end,
      gateway_provider: r.gateway_provider,
      gateway_customer_id: r.gateway_customer_id,
      gateway_subscription_id: r.gateway_subscription_id,
      checkout_url: r.checkout_url,
      billing_type: r.billing_type,
      next_due_date: r.next_due_date,
      created: r.created,
    }))
  },

  /**
   * Busca os pagamentos do usuário atual
   */
  async getMyPayments(): Promise<PaymentItem[]> {
    const records = await pb.collection('payments').getFullList({
      sort: '-created',
    })
    return records.map((r: any) => ({
      id: r.id,
      user: r.user,
      amount: r.amount,
      currency: r.currency || 'BRL',
      status: r.status,
      payment_method_type: r.payment_method_type,
      gateway_provider: r.gateway_provider,
      gateway_payment_id: r.gateway_payment_id,
      gateway_subscription_id: r.gateway_subscription_id,
      invoice_url: r.invoice_url,
      bank_slip_url: r.bank_slip_url,
      due_date: r.due_date,
      paid_at: r.paid_at,
      failure_reason: r.failure_reason,
      created: r.created,
    }))
  },

  /**
   * Simula um cenário no Sandbox (pagamento aprovado, recusado, vencido, estornado, cancelado)
   */
  async simulateSandboxScenario(params: {
    scenario:
      | 'payment_confirmed'
      | 'payment_received'
      | 'payment_overdue'
      | 'payment_refused'
      | 'payment_refunded'
      | 'subscription_canceled'
    plan_tier?: string
    billing_type?: string
    user_id?: string
  }) {
    const res = await pb.send('/backend/v1/billing/simulate-scenario', {
      method: 'POST',
      body: params,
    })
    return res
  },
}
