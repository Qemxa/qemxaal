# QEMXA - სრული პროექტის აღწერა და გაშვების ინსტრუქცია

## 1. პროექტის მიმოხილვა

### რა არის QEMXA?
QEMXA არის ინოვაციური ვებ-აპლიკაცია, რომელიც აერთიანებს ხელოვნურ ინტელექტს (AI) და ავტომობილების დიაგნოსტიკის სფეროს. ის წარმოადგენს ერთიან პლატფორმას, სადაც მძღოლებს შეუძლიათ მიიღონ AI-ზე დაფუძნებული რჩევები მანქანის პრობლემების შესახებ, ხოლო ავტო-სერვისებსა და ნაწილების მაღაზიებს — საკუთარი პროდუქტებისა და სერვისების შეთავაზება.

### ძირითადი ფუნქციონალი
-   **AI დიაგნოსტიკა:** მომხმარებლებს შეუძლიათ აღწერონ პრობლემა ტექსტურად ან ატვირთონ სურათი, რაზეც Gemini AI მოდელი აგენერირებს სავარაუდო დიაგნოზს და რეკომენდაციებს.
-   **პარტნიორების პორტალი:** სერვის ცენტრებს და მაღაზიებს შეუძლიათ შექმნან საკუთარი პროფილები, დაამატონ პროდუქტები/სერვისები და გამოჩნდნენ AI-ს რეკომენდაციებში.
-   **ფასიანი პაკეტები:** აპლიკაციას აქვს მრავალდონიანი ფასიანი სისტემა (Free, Premium, Platinum) როგორც მძღოლებისთვის, ასევე პარტნიორებისთვის, Stripe-ის ინტეგრაციით.
-   **თემის პერსონალიზაცია:** მომხმარებელს შეუძლია აირჩიოს აპლიკაციის ვიზუალური სტილი (ნათელი, მუქი და ა.შ.), რომელიც ინახება ლოკალურ მეხსიერებაში.

### ტექნოლოგიური არქიტექტურა
-   **Frontend:** React, TypeScript, Tailwind CSS.
-   **Backend (Serverless Functions):** Netlify Functions (Node.js).
-   **მონაცემთა ბაზა და ავთენტიფიკაცია:** Supabase (PostgreSQL).

---

## 2. პროექტის რეალურად გაშვების ინსტრუქცია (Deployment Guide)

მიჰყევით ამ ნაბიჯებს, რომ პროექტი ატვირთოთ ინტერნეტში და სრულად გაააქტიუროთ ყველა ფუნქცია.

### ნაბიჯი 0: მოსამზადებელი ეტაპი (ანგარიშების შექმნა)

დარწმუნდით, რომ გაქვთ ანგარიშები შემდეგ სერვისებზე:
1.  **[GitHub](https://github.com/):** კოდის შესანახად.
2.  **[Netlify](https://www.netlify.com/):** ჰოსტინგისთვის.
3.  **[Supabase](https://supabase.com/):** მონაცემთა ბაზისთვის.
4.  **[Stripe](https://stripe.com/):** გადახდებისთვის.
5.  **[Google AI Studio](https://aistudio.google.com/):** Gemini API-ს გასაღებისთვის.

### ნაბიჯი 1: Supabase-ის კონფიგურაცია (მონაცემთა ბაზა)

1.  **შექმენით პროექტი:** შედით Supabase-ზე და შექმენით ახალი პროექტი.
2.  **შექმენით ცხრილები:** პროექტის შექმნის შემდეგ, გადადით **SQL Editor**-ზე, დააკოპირეთ და გაუშვით ქვემოთ მოცემული SQL კოდი.

    ```sql
    -- 1. მომხმარებლების პროფილების ცხრილი
    CREATE TABLE profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        tier TEXT NOT NULL DEFAULT 'free',
        dailyUsage JSONB NOT NULL DEFAULT '{"date": "2024-01-01", "count": 0}',
        stripe_customer_id TEXT UNIQUE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Note: The trigger for creating a profile on new user signup has been removed.
    -- Profile creation is now handled by the application code to prevent race conditions.
    -- Row Level Security must be enabled and an INSERT policy must be added.

    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Users can create their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


    -- 2. მანქანების ცხრილი
    CREATE TABLE vehicles (
        vin TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage their own vehicles." ON vehicles FOR ALL USING (auth.uid() = user_id);

    -- 3. ჩატების ცხრილი
    CREATE TABLE chats (
        vin TEXT PRIMARY KEY REFERENCES vehicles(vin) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        messages JSONB NOT NULL,
        serviceHistory JSONB,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage chats for their vehicles." ON chats FOR ALL USING (auth.uid() = user_id);

    -- 4. პარტნიორების პროფილების ცხრილი
    CREATE TABLE partner_profiles (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'free',
        description TEXT,
        address TEXT,
        phone TEXT,
        products JSONB,
        services JSONB,
        stripe_customer_id TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Partners can manage their own profiles." ON partner_profiles FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "All users can view partner profiles." ON partner_profiles FOR SELECT USING (true);
    ```

3.  **აიღეთ API გასაღებები:**
    -   გადადით **Project Settings > API**.
    -   **Project URL:** დააკოპირეთ.
    -   **Project API Keys > `anon` `public`:** დააკოპირეთ ეს გასაღები.
    -   **Project API Keys > `service_role` `secret`:** დააკოპირეთ ეს გასაღები. **ეს არის საიდუმლო!**

4.  **შეავსეთ გასაღებები კოდში:**
    - გახსენით ფაილი: `services/supabaseService.ts`
    - ჩაანაცვლეთ `supabaseUrl` და `supabaseAnonKey` ცვლადების მნიშვნელობები თქვენი Supabase-ის მონაცემებით.

### ნაბიჯი 2: Stripe-ის კონფიგურაცია (გადახდები)

1.  **პროდუქტები და ფასები:**
    -   შედით Stripe Dashboard-ზე და შექმენით 2 პროდუქტი: `QEMXA - User Subscription` და `QEMXA - Partner Subscription`.
    -   თითოეულ პროდუქტს დაამატეთ `Premium` და `Platinum` ფასები (Price). დარწმუნდით, რომ ფასი არის **Recurring** (ყოველთვიური).
    -   თითოეული ფასისთვის დააკოპირეთ მისი **API ID** (მაგ: `price_1Pj...`).
2.  **API გასაღებები:**
    -   გადადით **Developers > API keys**.
    -   დააკოპირეთ **Secret key**. **ეს არის საიდუმლო!**
3.  **Webhook-ის კონფიგურაცია:**
    -   გადადით **Developers > Webhooks > Add an endpoint**.
    -   **Endpoint URL:** ამას შეავსებთ მოგვიანებით, Netlify-ს მისამართის მიღების შემდეგ. ფორმატი: `https://YOUR_NETLIFY_SITE.netlify.app/.netlify/functions/stripe-webhook`
    -   **Listen to events:** აირჩიეთ: `checkout.session.completed` და `customer.subscription.deleted`.
    -   დააჭირეთ **Add endpoint**. გახსნილ გვერდზე დააკოპირეთ **Signing secret**. **ესეც საიდუმლოა!**

### ნაბიჯი 3: Google AI Studio-ს კონფიგურაცია

1.  შედით [Google AI Studio](https://aistudio.google.com/)-ზე.
2.  დააჭირეთ **Get API key > Create API key in new project**.
3.  დააკოპირეთ API გასაღები. **ეს არის საიდუმლო!**

### ნაბიჯი 4: პროექტის Netlify-ზე გაშვება

1.  **ატვირთეთ კოდი GitHub-ზე:** შექმენით ახალი რეპოზიტორია და ატვირთეთ პროექტის ყველა ფაილი.
2.  **პროექტის შექმნა Netlify-ზე:**
    -   Netlify-ზე დააჭირეთ **Add new site > Import an existing project**.
    -   აირჩიეთ თქვენი GitHub რეპოზიტორია.
3.  **Build Settings:**
    -   **Build command:** `npm install && tsc`
    -   **Publish directory:** `.`
4.  **გარემოს ცვლადების (Environment Variables) დამატება:**
    -   პროექტის შექმნის შემდეგ, გადადით **Site configuration > Build & deploy > Environment variables**.
    -   დაამატეთ ყველა თქვენი საიდუმლო გასაღები:
        -   `API_KEY` (Google Gemini-ს გასაღები)
        -   `STRIPE_SECRET_KEY` (Stripe-ის საიდუმლო გასაღები)
        -   `STRIPE_WEBHOOK_SECRET` (Stripe-ის webhook-ის საიდუმლო)
        -   `SUPABASE_URL` (Supabase-ის პროექტის მისამართი)
        -   `SUPABASE_SERVICE_ROLE_KEY` (Supabase-ის `service_role` გასაღები)
5.  **Deploy:** დააჭირეთ **Deploy site**.

### ნაბიჯი 5: საბოლოო კავშირების დამყარება

1.  **შეავსეთ Stripe Price ID-ები:**
    -   გახსენით `netlify/functions/create-stripe-checkout.ts` და `price_YOUR_..._ID`-ების ნაცვლად ჩასვით Stripe-დან აღებული **Price ID**-ები.
    -   **მნიშვნელოვანია:** ამ ცვლილებების შემდეგ, ხელახლა ატვირთეთ კოდი GitHub-ზე.
2.  **განაახლეთ Stripe Webhook:**
    -   დააკოპირეთ თქვენი Netlify საიტის მისამართი.
    -   დაბრუნდით Stripe-ის Webhook-ის პარამეტრებში და **Endpoint URL** ველში ჩასვით `https://YOUR-SITE.netlify.app/.netlify/functions/stripe-webhook`. შეინახეთ.

###გილოცავთ! 🎉
თქვენი პროექტი სრულად ფუნქციონალურია.