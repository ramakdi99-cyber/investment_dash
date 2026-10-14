-- ============================================================================
-- DEMO SEED — the 20 fictional leads from the mock dataset
-- ============================================================================
-- Populates public.leads with the same 20 fictional investors the dashboard
-- shipped with, so you can verify the React <-> Supabase flow end-to-end.
--
-- These are FICTIONAL records. Do not put real investor data in the public demo.
--
-- Safe to re-run: `on conflict (whatsapp_id) do nothing` skips rows that already
-- exist. Timestamps are expressed relative to now() so the demo always looks
-- fresh; adjust or replace them for a fixed dataset.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run.
--
-- Value conventions match the mapper in src/services/db-mapper.ts:
--   * status is upper-case (NEW, FOLLOW_UP, NOT_INTERESTED, ...)
--   * investment_goal / monthly_budget_range use the canonical keys
--   * source / campaign_name use the human labels
--   * assigned_to stores the employee name (the UI also matches by name)
-- ============================================================================

insert into public.leads
  (name, phone, whatsapp_id, first_message, source, campaign_name, ad_id,
   investment_goal, monthly_budget_range, time_horizon, risk_comfort, experience,
   status, assigned_to, last_contact_at, created_at)
values
  ('Arun Kumar',       '+91 98XXXXXX10', 'lead_1001', 'I''d like to learn how a monthly SIP works.',                 'Instagram', 'SIP Basics Reel',          'ad_sip_reel_01', 'long-term-savings', '5k-10k',      '10+ years',                      'Some fluctuations',                  'Beginner',                 'QUALIFIED',      'Aarav Sharma',   now() - interval '0 days', now() - interval '0 days'),
  ('Priya S',          '+91 97XXXXXX21', 'lead_1002', 'I want to explore mutual funds for retirement.',              'Facebook',  'Retirement Planning',      NULL,             'retirement',        '10k-20k',     '15–20 years',                    'Moderate fluctuations',              'Beginner',                 'NEW',            NULL,             NULL,                       now() - interval '0 days'),
  ('Karthik R',        '+91 96XXXXXX32', 'lead_1003', 'I''m new to mutual funds. Where should I start?',             'Instagram', 'Beginner Guide Story',     NULL,             'learn-basics',      'under-1k',    '5–10 years',                     NULL,                                 'No experience',            'CONTACTED',      'Priya Nair',     now() - interval '0 days', now() - interval '1 days'),
  ('Meena Lakshmi',    '+91 95XXXXXX43', 'lead_1004', 'I want to plan for my child''s education.',                   'Facebook',  'Child Education Carousel', NULL,             'child-education',   '5k-10k',      '8–12 years',                     'Lower fluctuations preferred',       'Some experience',          'FOLLOW_UP',      'Aarav Sharma',   now() - interval '1 days', now() - interval '1 days'),
  ('Vijay Anand',      '+91 94XXXXXX54', 'lead_1005', 'Can you explain how SIP investing works?',                    'Instagram', 'SIP Basics Reel',          'ad_sip_reel_02', 'monthly-sip',       '1k-5k',       '3–5 years',                      'Some fluctuations',                  'Some experience',          'QUALIFIED',      'Rohan Deshmukh', now() - interval '0 days', now() - interval '1 days'),
  ('Divya M',          '+91 93XXXXXX65', 'lead_1006', 'Can you compare mutual funds with FDs?',                      'Facebook',  'FD vs Mutual Funds',       NULL,             'compare-options',   '5k-10k',      '1–3 years',                      'Lower fluctuations preferred',       'Beginner',                 'NEW',            NULL,             NULL,                       now() - interval '1 days'),
  ('Suresh Babu',      '+91 92XXXXXX76', 'lead_1007', 'I want to understand long-term retirement options.',          'Instagram', 'Retirement Planning',      NULL,             'retirement',        '20k-30k',     '20+ years',                      'Some fluctuations',                  'Experienced',              'CONTACTED',      'Priya Nair',     now() - interval '1 days', now() - interval '2 days'),
  ('Nandhini P',       '+91 91XXXXXX87', 'lead_1008', 'I''d like to understand mutual funds before deciding.',       'Facebook',  'Beginner Guide Story',     NULL,             'learn-basics',      'not-decided', NULL,                             NULL,                                 'No experience',            'NEW',            NULL,             NULL,                       now() - interval '2 days'),
  ('Mohammed Faisal',  '+91 90XXXXXX98', 'lead_1009', 'I am considering a monthly SIP.',                             'Instagram', 'SIP Basics Reel',          NULL,             'monthly-sip',       '1k-5k',       '5–10 years',                     'Moderate fluctuations',              'Beginner',                 'FOLLOW_UP',      'Rohan Deshmukh', now() - interval '0 days', now() - interval '2 days'),
  ('Anitha R',         '+91 89XXXXXX09', 'lead_1010', 'Can you explain options for education planning?',             'Facebook',  'Child Education Carousel', NULL,             'child-education',   '10k-20k',     '10–15 years',                    'Some fluctuations',                  'Some experience',          'QUALIFIED',      'Aarav Sharma',   now() - interval '1 days', now() - interval '3 days'),
  ('Prakash D',        '+91 88XXXXXX19', 'lead_1011', 'I''d like to compare different savings options.',             'Instagram', 'FD vs Mutual Funds',       NULL,             'compare-options',   '20k-30k',     '3–5 years',                      'Lower fluctuations preferred',       'Experienced',              'CONTACTED',      'Priya Nair',     now() - interval '2 days', now() - interval '3 days'),
  ('Kavitha S',        '+91 87XXXXXX29', 'lead_1012', 'Please share basic information about mutual funds.',          'Facebook',  'Beginner Guide Story',     NULL,             'learn-basics',      'under-1k',    '1–3 years',                      NULL,                                 'Beginner',                 'NOT_INTERESTED', 'Rohan Deshmukh', now() - interval '3 days', now() - interval '4 days'),
  ('Ramesh Kumar',     '+91 86XXXXXX39', 'lead_1013', 'I''m planning for retirement and want to learn more.',        'Instagram', 'Retirement Planning',      NULL,             'retirement',        '5k-10k',      '10–15 years',                    'Moderate fluctuations',              'Some experience',          'QUALIFIED',      'Aarav Sharma',   now() - interval '0 days', now() - interval '4 days'),
  ('Sneha V',          '+91 85XXXXXX49', 'lead_1014', 'How do I begin a monthly SIP?',                               'Instagram', 'SIP Basics Reel',          NULL,             'monthly-sip',       '10k-20k',     '5–10 years',                     'Some fluctuations',                  'Beginner',                 'NEW',            NULL,             NULL,                       now() - interval '4 days'),
  ('Bala Murugan',     '+91 84XXXXXX59', 'lead_1015', 'I want to save for my child''s future education.',            'Instagram', 'Child Education Carousel', NULL,             'child-education',   '1k-5k',       '8–12 years',                     NULL,                                 'Beginner',                 'FOLLOW_UP',      'Priya Nair',     now() - interval '2 days', now() - interval '5 days'),
  ('Harini K',         '+91 83XXXXXX69', 'lead_1016', 'What are the differences between FDs and mutual funds?',      'Facebook',  'FD vs Mutual Funds',       NULL,             'compare-options',   '5k-10k',      '1–3 years',                      'Lower fluctuations preferred',       'Some experience',          'NEW',            NULL,             NULL,                       now() - interval '5 days'),
  ('Gokul S',          '+91 82XXXXXX79', 'lead_1017', 'I already invest and want to review my options.',             'Instagram', 'SIP Basics Reel',          NULL,             'monthly-sip',       '20k-30k',     '10+ years',                      'Significant fluctuations acceptable', 'Experienced',              'CONVERTED',      'Rohan Deshmukh', now() - interval '4 days', now() - interval '6 days'),
  ('Revathi M',        '+91 81XXXXXX89', 'lead_1018', 'Can someone explain the basics to me?',                       'Facebook',  'Beginner Guide Story',     NULL,             'learn-basics',      '1k-5k',       '5–10 years',                     'Some fluctuations',                  'Beginner',                 'CONTACTED',      'Aarav Sharma',   now() - interval '1 days', now() - interval '6 days'),
  ('Dinesh P',         '+91 80XXXXXX99', 'lead_1019', 'I''d like to discuss planning for retirement.',               'Instagram', 'Retirement Planning',      NULL,             'retirement',        '10k-20k',     '15–20 years',                    'Moderate fluctuations',              'Some experience',          'FOLLOW_UP',      'Priya Nair',     now() - interval '0 days', now() - interval '7 days'),
  ('Janani T',         '+91 79XXXXXX08', 'lead_1020', 'I want to learn about mutual funds and SIPs.',                'Facebook',  'SIP Basics Reel',          NULL,             'monthly-sip',       'not-decided', NULL,                             NULL,                                 'No experience',            'NEW',            NULL,             NULL,                       now() - interval '8 days')
on conflict (whatsapp_id) do nothing;
