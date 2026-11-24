-- DADOS DE EXEMPLO, SÓ PARA DESENVOLVIMENTO. Não rode em produção.
-- Nenhum destes valores foi definido pelo cliente; todos são trocados na tela Ajustes.
update public.configuracoes set
  preco_adulto_centavos = 3000,      -- EXEMPLO (valor de referência do site)
  preco_crianca_centavos = 1500,     -- EXEMPLO (valor de referência do site)
  dayuse_limite_padrao = 100,        -- EXEMPLO
  dayuse_dias_semana = '{0,6}',      -- EXEMPLO: domingo e sábado
  dayuse_hora_limite_mesmo_dia = '12:00', -- EXEMPLO
  sinal_tipo = 'percentual',         -- EXEMPLO
  sinal_valor = 50,                  -- EXEMPLO
  sinal_prazo_horas = 24,            -- EXEMPLO
  regra_cancelamento = '[EXEMPLO] Regra de cancelamento, remarcação e chuva a definir pelo cliente.',
  dados_de_exemplo = true;

insert into public.chales (nome, capacidade, tarifa_centavos, ordem) values
  ('Chalé de exemplo 1', 4, 35000, 1),
  ('Chalé de exemplo 2', 6, 45000, 2);
