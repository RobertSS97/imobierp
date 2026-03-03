// ─── Consulta de CEP via ViaCEP ─────────────────────────────────

export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Consulta o CEP na API ViaCEP e retorna os dados do endereço.
 * Retorna null se o CEP for inválido ou não encontrado.
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResult | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) return null;
    const data: ViaCepResult = await response.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Mapeia o resultado do ViaCEP para os campos de endereço do formulário.
 */
export function mapCepToAddressFields(data: ViaCepResult): {
  addressStreet: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
} {
  return {
    addressStreet: data.logradouro || "",
    addressNeighborhood: data.bairro || "",
    addressCity: data.localidade || "",
    addressState: data.uf || "",
    addressZipCode: data.cep?.replace("-", "") || "",
  };
}
