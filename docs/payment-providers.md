# Payment provider evaluation

Reviewed November 26, 2026. SkillNest needs a contract with a Pakistan-registered marketplace, a Pakistani business bank account, and international card acceptance for individual tutoring lessons.

| Provider | Published evidence | Open questions |
| --- | --- | --- |
| Safepay Pakistan | Publishes test payment methods, card rails, a sandbox API, webhooks, and domestic/international payment options. Its onboarding requires merchant verification before live processing. [API reference](https://apidocs.getsafepay.com/) · [Pricing and payment methods](https://safepay.com.pk/pricing) · [Onboarding](https://safepay.helpscoutdocs.com/article/50-starting-with-safepay-step-by-step-guide) | Confirm the tutoring marketplace use case, per-currency presentment and Pakistani settlement, refund and reversal events, and sandbox credentials. |
| Premier PayFast Pakistan | Its merchant FAQ describes international card payment support and onboarding requirements. [PayFast merchant FAQ](https://premierpayfast.com/faqs/) | Confirm cross-border acceptance by card country, settlement currency, signed callback and retry guarantees, reconciliation exports, and marketplace eligibility. |
| Stripe Payments | Pakistan is absent from its published merchant availability list. [Stripe global availability](https://stripe.com/global) | Direct onboarding for the current Pakistani entity has no documented path. |

Start technical validation with Safepay once sandbox access is available. Obtain written approval for marketplace settlement and manual tutor payouts before selecting a live provider. Also verify chargebacks, FX and fees, refund capabilities, reconciliation exports, and the expected merchant-of-record arrangement. No provider has been selected and no merchant account has been opened for this work.
