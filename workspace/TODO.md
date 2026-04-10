<instructions>
This file powers chat suggestion chips. Keep it focused and actionable.

# Be proactive
- Suggest ideas and things the user might want to add *soon*. 
- Important things the user might be overlooking (SEO, more features, bug fixes). 
- Look specifically for bugs and edge cases the user might be missing (e.g., what if no user has logged in).

# Rules
- Each task must be wrapped in a "<todo id="todo-id">" and "</todo>" tag pair.
- Inside each <todo> block:
  - First line: title (required)
  - Second line: description (optional)
- The id must be a short stable identifier for the task and must not change when you rewrite the title or description.
- You should proactively review this file after each response, even if the user did not explicitly ask, maintain it if there were meaningful changes (new requirement, task completion, reprioritization, or stale task cleanup).
- Think BIG: suggest ambitious features, UX improvements, technical enhancements, and creative possibilities.
- Balance quick wins with transformative ideas — include both incremental improvements and bold new features.
- Aim for 3-5 high-impact tasks that would genuinely excite the user.
- Tasks should be specific enough to act on, but visionary enough to inspire.
- Remove or rewrite stale tasks when completed, obsolete, or clearly lower-priority than current work.
- Re-rank by impact and user value, not just urgency.
- Draw inspiration from the project's existing features — what would make them 10x better?
- Don't be afraid to suggest features the user hasn't explicitly mentioned.
</instructions>


<!-- 🔴 KRITIKE — Bugs që prishin funksionalitetin -->

<todo id="bug-validation-cars">
🔴 [Bug #1] AdminCars — Validim i fushave të detyrueshme mungon
handleSave() nuk kontrollon brand/model/year/pricePerDay — mund të krijohet makinë bosh në DB
</todo>




<todo id="bug-customer-name-fallback">
🔴 [Bug #5] AdminReservations — getCustomerName() kthyen ID-në kur emri është string bosh
c?.name ?? customerId: nëse name është "", shfaqet ID-ja e papërpunuar
</todo>

<!-- 🟡 TË MESME — UX / data issues -->



<!-- 🚀 Features -->

<todo id="pricing-rule-apply-count">
Rrit usageCount kur zbatohet një rregull
Kur një PricingRule zbatohet gjatë rezervimit, update usageCount++ në DB për statistika të sakta
</todo>

<todo id="whatsapp-integration">
Integro WhatsApp për konfirmime automatike
Dërgo konfirmim rezervimi dhe kujtesë para datës së pickup via WhatsApp Business API
</todo>

<todo id="payment-status-tracking">
Shto Payment Status në Reservations
Pending Payment, Paid, Partial - për menaxhim financiar më të mirë
</todo>

<todo id="gps-integration">
Integro GPS tracking me API real
Fleet Mgmt GPS tab është placeholder — lidhe me Trackimo ose Teltonika API për gjurmim live
</todo>
