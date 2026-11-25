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

-- EXEMPLO: quantidade, nomes, capacidade e tarifa das acomodações ainda não foram informados pelo cliente.
insert into public.chales (nome, tipo, capacidade, tarifa_centavos, ordem) values
  ('Chalé de exemplo 1', 'chale', 4, 35000, 1),
  ('Chalé de exemplo 2', 'chale', 6, 45000, 2),
  ('Apartamento de exemplo 1', 'apartamento', 2, 25000, 3),
  ('Apartamento de exemplo 2', 'apartamento', 3, 28000, 4);

-- EXEMPLO: alguns períodos ocupados, para o calendário do site ter o que mostrar em desenvolvimento.
insert into public.chale_ocupacoes (chale_id, periodo, origem, motivo)
select c.id, daterange(current_date + o.ini, current_date + o.fim), 'bloqueio', '[EXEMPLO]'
from public.chales c
join (values
  ('Chalé de exemplo 1', 3, 6), ('Chalé de exemplo 1', 12, 14),
  ('Chalé de exemplo 2', 4, 8),
  ('Apartamento de exemplo 1', 4, 6), ('Apartamento de exemplo 1', 20, 23),
  ('Apartamento de exemplo 2', 2, 6), ('Apartamento de exemplo 2', 12, 13)
) as o(nome, ini, fim) on o.nome = c.nome;
