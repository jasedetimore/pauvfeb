-- Seed issuer_details with initial sample records
INSERT INTO public.issuer_details (name, ticker, bio, headline, tag)
VALUES
    ('Jaxson Sterling', 'JXSTERLING', $$Former D1 quarterback turned extreme mountain biker. Chasing adrenaline and a Red Bull sponsorship.$$ , $$Peak Performance or Bust$$, 'athlete'),
    ('Aria Vane', 'ARVANE', $$Lo-fi producer blending neo-soul with urban "found sounds." Her debut EP was recorded entirely on a subway platform.$$ , $$The Sound of the Streets$$, 'musician'),
    ('Silas Thorne', 'STHORNE', $$Dark academia novelist known for intricate gothic mysteries. He writes exclusively by candlelight in a converted bell tower.$$ , $$Ink, Blood, and Secrets$$, 'author'),
    ('Minka Moon', 'MINKAMOON', $$Maximalist fashion icon specializing in "thrifting for the apocalypse." She believes glitter is a neutral color.$$ , $$Chaos, But Make It Fashion$$, 'influencer'),
    ('Leo Vance', 'LVANCE', $$Investigating the world's most niche conspiracies from his basement studio. He hasn't slept since the "Moon is Cheese" episode.$$ , $$The Truth is Probably Weird$$, 'podcaster'),
    ('Elara Finn', 'ELARAFINN', $$Method actor currently living as a 19th-century lighthouse keeper. She refuses to use a smartphone until production wraps.$$ , $$Living the Part$$, 'actor'),
    ('Kobe Rivers', 'KOBRIVERS', $$Professional tag player and parkour enthusiast. He's looking to turn playground games into the next Olympic sport.$$ , $$Catch Him If You Can$$, 'athlete'),
    ('Zara Xo', 'ZARAXO', $$Hyper-pop princess with a voice like candy and lyrics like a razor blade. She performs exclusively in hologram form.$$ , $$The Future is Digital$$, 'musician'),
    ('Benji Blaise', 'BBLAISE', $$A professional "failure" who interviews tech moguls about their biggest disasters. He's making it okay to crash and burn.$$ , $$Failing Upwards$$, 'podcaster'),
    ('Orla Quinn', 'ORQUINN', $$Sci-fi writer crafting a 12-book epic about sentient lichen. She's already sold the film rights to a studio that doesn't exist yet.$$ , $$Worlds Beyond the Surface$$, 'author');
