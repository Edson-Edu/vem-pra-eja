export function configuracaoBanco(prefixo = "DB") {
  const url = process.env[`${prefixo === "DB" ? "DATABASE" : prefixo}_URL`];
  if (url) return { connectionString: url };
  const valor = (nome, padrao = "") => process.env[`${prefixo}_${nome}`] || padrao;
  const configuracao = {
    host: valor("HOST", "db"), port: Number(valor("PORT", "5432")), database: valor("NAME", "vempraeja"),
    user: valor("USER", prefixo === "MIGRATION_DB" ? "postgres" : "vempraeja_app"), password: valor("PASSWORD"),
  };
  if (!configuracao.password) throw new Error(`${prefixo}_PASSWORD não configurada.`);
  return configuracao;
}
