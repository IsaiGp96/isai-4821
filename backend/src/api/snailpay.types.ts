export interface ChargeRequest {
  card_number: string;
  expiration_date: string;
  cvv: string;
  cardholder_name: string;
  amount: number;
  payer_id: string;
  payer_email: string;
}

export type ChargeStatus = 'approved' | 'rejected' | 'error';

export type ChargeStatusDetail =
  | 'accredited'
  | 'invalid_card_number'
  | 'invalid_expiration_date'
  | 'invalid_cvv'
  | 'invalid_cardholder_name'
  | 'invalid_amount'
  | 'amount_exceeds_limit'
  | 'invalid_payer'
  | 'cvv_mismatch'
  | 'insufficient_funds'
  | 'card_declined'
  | 'service_unavailable';

export interface ChargeResponse {
  id: string;
  status: ChargeStatus;
  status_detail: ChargeStatusDetail;
  message: string;
  transaction_amount: number;
  date_created: string;
  authorization_code: string | null;
  reference: string;
  payer_id: string;
  payer_email: string;
  card_number: string;
  cvv: string;
}
