import { useState, useEffect } from "react";
import { Plus, ChevronRight, Utensils, Search, Clock, X, BookOpen } from "lucide-react";
import { supabase } from "./supabase";
import { PageTitle, SectionLabel, Card, Button, Chip, Ring, Segmented, Sheet, EmptyState, Field } from "./ui";
import { Loading, Toast, BackLink, Select, MiniField, SearchBox, FilterChips, ConfirmRemove } from "./tools/kit";
import { useToast } from "./tools/useToast";

const MEAL_TIMES = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Evening Snack", "Pre-Workout", "Post-Workout"];
const MEAL_TIME_LABEL = {
  "Morning Snack": "Morning snack", "Afternoon Snack": "Afternoon snack", "Evening Snack": "Evening snack",
  "Pre-Workout": "Pre-workout", "Post-Workout": "Post-workout",
};
const mealTimeLabel = (t) => MEAL_TIME_LABEL[t] ?? t;

const MACROS = [
  { key: "protein_g", label: "Protein", short: "P", color: "var(--protein)" },
  { key: "carbs_g",   label: "Carbs",   short: "C", color: "var(--carbs)" },
  { key: "fats_g",    label: "Fats",    short: "F", color: "var(--fats)" },
];

const EMPTY_PLAN = { name: "", client_id: "", daily_calories: "", protein_target_g: "", carbs_target_g: "", fats_target_g: "" };
const EMPTY_MANUAL = { food_name: "", serving_size_g: "", calories: "", protein_g: "", carbs_g: "", fats_g: "" };

const round = (n, dp = 0) => {
  const v = Number(n) || 0;
  return dp ? Math.round(v * 10 ** dp) / 10 ** dp : Math.round(v);
};
const fmt = (n) => round(n).toLocaleString("en-AU");

// Totals across a list of food rows (meal_foods or meal_template_foods).
function sumFoods(foods) {
  return foods.reduce((t, f) => ({
    calories: t.calories + (Number(f.calories) || 0),
    protein_g: t.protein_g + (Number(f.protein_g) || 0),
    carbs_g: t.carbs_g + (Number(f.carbs_g) || 0),
    fats_g: t.fats_g + (Number(f.fats_g) || 0),
  }), { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 });
}

/* "12g P · 30g C · 4g F" with each macro in its own colour. */
function MacroLine({ p, c, f, dp = 1, className = "" }) {
  return (
    <span className={`inline-flex gap-2 text-[13px] font-semibold tabular-nums ${className}`}>
      <span style={{ color: "var(--protein)" }}>{round(p, dp)}g P</span>
      <span style={{ color: "var(--carbs)" }}>{round(c, dp)}g C</span>
      <span style={{ color: "var(--fats)" }}>{round(f, dp)}g F</span>
    </span>
  );
}

/* Protein / carbs / fats split as one thin bar. */
function MacroSplitBar({ p, c, f }) {
  const total = (p || 0) + (c || 0) + (f || 0);
  if (total <= 0) return null;
  return (
    <div className="h-2 rounded-full bg-surface-2 overflow-hidden flex">
      <div style={{ width: `${(p / total) * 100}%`, backgroundColor: "var(--protein)" }} />
      <div style={{ width: `${(c / total) * 100}%`, backgroundColor: "var(--carbs)" }} />
      <div style={{ width: `${(f / total) * 100}%`, backgroundColor: "var(--fats)" }} />
    </div>
  );
}

/* One macro: planned vs target with a bar in the macro colour. */
function MacroProgress({ label, color, value, target }) {
  const pct = target ? Math.min(1, value / target) : 0;
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <p className="text-[13px] text-muted tabular-nums whitespace-nowrap">
        <span className="font-display text-[20px] text-ink">{round(value)}</span>
        {target ? ` / ${target}g` : "g"}
      </p>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden mt-1">
        {target ? <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: color }} /> : null}
      </div>
    </div>
  );
}

export default function NutritionPlanner() {
  const [activeTab, setActiveTab] = useState("plans");
  const [userId, setUserId] = useState(null);

  // ── Meal plans ──
  const [clients, setClients] = useState([]);
  const [clientNameMap, setClientNameMap] = useState({});
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState(EMPTY_PLAN);
  const [meals, setMeals] = useState([]);
  const [mealFoods, setMealFoods] = useState({});
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: "", meal_time: "Breakfast" });
  const [plansLoading, setPlansLoading] = useState(true);
  const [mealsLoading, setMealsLoading] = useState(false);

  // Food search (one meal at a time, in a sheet)
  const [activeFoodMealId, setActiveFoodMealId] = useState(null);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingSize, setServingSize] = useState(100);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFood, setManualFood] = useState(EMPTY_MANUAL);

  // ── Meal ideas (templates) ──
  const [mealTemplates, setMealTemplates] = useState([]);
  const [templateCategories, setTemplateCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMealTime, setSelectedMealTime] = useState("All");
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [templateFoods, setTemplateFoods] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // ── Food lookup ──
  const [dbQuery, setDbQuery] = useState("");
  const [dbResults, setDbResults] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbSearched, setDbSearched] = useState(false);
  const [dbServingSizes, setDbServingSizes] = useState({});

  const [toast, showToast] = useToast();
  const showSuccess = (msg) => showToast(msg);
  const showError = (msg) => showToast(msg, "bad");

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  // ── Fetch clients ──
  useEffect(() => {
    if (!userId) return;
    const run = async () => {
      try {
        const { data, error } = await supabase.from("clients").select("id, full_name").eq("pt_id", userId);
        if (error) throw error;
        setClients(data || []);
        const map = {};
        (data || []).forEach(c => { map[c.id] = c.full_name; });
        setClientNameMap(map);
      } catch (err) { console.error("fetch clients:", err); }
    };
    run();
  }, [userId]);

  // ── Fetch meal plans ──
  const fetchMealPlans = async () => {
    if (!userId) return;
    setPlansLoading(true);
    try {
      const { data, error } = await supabase.from("meal_plans").select("*").eq("created_by", userId).order("created_at", { ascending: false });
      if (error) throw error;
      setMealPlans(data || []);
    } catch (err) { console.error("fetch meal plans:", err); }
    finally { setPlansLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMealPlans(); }, [userId]);

  // ── Fetch meals + meal foods for selected plan ──
  const fetchAllMealFoods = async (mealsArr) => {
    if (!mealsArr.length) { setMealFoods({}); return; }
    try {
      const { data, error } = await supabase.from("meal_foods").select("*").in("meal_id", mealsArr.map(m => m.id));
      if (error) throw error;
      const grouped = {};
      mealsArr.forEach(m => { grouped[m.id] = []; });
      (data || []).forEach(f => { if (grouped[f.meal_id]) grouped[f.meal_id].push(f); else grouped[f.meal_id] = [f]; });
      setMealFoods(grouped);
    } catch (err) { console.error("fetch meal foods:", err); }
  };

  const fetchMeals = async (planId) => {
    setMealsLoading(true);
    try {
      const { data, error } = await supabase.from("meals").select("*").eq("meal_plan_id", planId).order("order_index");
      if (error) throw error;
      const list = data || [];
      setMeals(list);
      await fetchAllMealFoods(list);
    } catch (err) { console.error("fetch meals:", err); }
    finally { setMealsLoading(false); }
  };

  useEffect(() => {
    if (selectedPlan?.id) fetchMeals(selectedPlan.id);
    else { setMeals([]); setMealFoods({}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan?.id]);

  // ── Fetch meal templates ──
  useEffect(() => {
    if (activeTab !== "library") return;
    const run = async () => {
      setTemplatesLoading(true);
      try {
        const { data, error } = await supabase.from("meal_templates").select("*");
        if (error) throw error;
        setMealTemplates(data || []);
        const cats = ["All", ...new Set((data || []).map(t => t.category).filter(Boolean))];
        setTemplateCategories(cats);
      } catch (err) { console.error("fetch templates:", err); }
      finally { setTemplatesLoading(false); }
    };
    run();
  }, [activeTab]);

  // ── Fetch foods + full meal data for selected meal template ──
  useEffect(() => {
    if (selectedMeal && showMealModal) {
      // Re-fetch the full row to guarantee instructions and prep_time_minutes are present
      supabase
        .from("meal_templates")
        .select("*")
        .eq("id", selectedMeal.id)
        .single()
        .then(({ data }) => { if (data) setSelectedMeal(data); });
      supabase
        .from("meal_template_foods")
        .select("*")
        .eq("meal_template_id", selectedMeal.id)
        .then(({ data }) => { if (data) setTemplateFoods(data); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMealModal]);

  // ── Debounced food search (adding to a meal) ──
  useEffect(() => {
    if (!foodQuery || foodQuery.length < 2) { setFoodResults([]); return; }
    const t = setTimeout(async () => {
      setFoodLoading(true);
      try {
        const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodQuery)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,nutriments,serving_size,code`);
        const json = await res.json();
        const parsed = (json.products || [])
          .filter(p => p.product_name && typeof p.nutriments?.["energy-kcal_100g"] === "number")
          .map(p => ({
            food_name: p.product_name,
            brand: p.brands || "",
            calories: p.nutriments["energy-kcal_100g"] || 0,
            protein_g: p.nutriments["proteins_100g"] || 0,
            carbs_g: p.nutriments["carbohydrates_100g"] || 0,
            fats_g: p.nutriments["fat_100g"] || 0,
            open_food_facts_id: p.code || "",
          }));
        setFoodResults(parsed);
      } catch (err) { console.error("food search:", err); }
      finally { setFoodLoading(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [foodQuery]);

  // ── Debounced food lookup ──
  useEffect(() => {
    if (dbQuery.length < 3) { setDbResults([]); setDbSearched(false); return; }
    const t = setTimeout(async () => {
      setDbLoading(true);
      setDbSearched(true);
      try {
        const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(dbQuery)}&search_simple=1&action=process&json=1&page_size=12&fields=product_name,brands,nutriments,serving_size,image_small_url,code`);
        const json = await res.json();
        const parsed = (json.products || [])
          .filter(p => p.product_name && typeof p.nutriments?.["energy-kcal_100g"] === "number")
          .map(p => ({
            code: p.code || p.product_name,
            food_name: p.product_name,
            brand: p.brands || "",
            calories: p.nutriments["energy-kcal_100g"] || 0,
            protein_g: p.nutriments["proteins_100g"] || 0,
            carbs_g: p.nutriments["carbohydrates_100g"] || 0,
            fats_g: p.nutriments["fat_100g"] || 0,
          }));
        setDbResults(parsed);
      } catch (err) { console.error("db food search:", err); }
      finally { setDbLoading(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [dbQuery]);

  // ── Handlers ──
  const handleCreatePlan = async (e) => {
    e?.preventDefault();
    if (!newPlan.name.trim()) { showError("Plan name is required"); return; }
    try {
      const { error } = await supabase.from("meal_plans").insert({
        name: newPlan.name.trim(),
        client_id: newPlan.client_id || null,
        daily_calories: newPlan.daily_calories ? parseInt(newPlan.daily_calories) : null,
        protein_target_g: newPlan.protein_target_g ? parseInt(newPlan.protein_target_g) : null,
        carbs_target_g: newPlan.carbs_target_g ? parseInt(newPlan.carbs_target_g) : null,
        fats_target_g: newPlan.fats_target_g ? parseInt(newPlan.fats_target_g) : null,
        created_by: userId,
        is_active: true,
        is_template: false,
      });
      if (error) throw error;
      setNewPlan(EMPTY_PLAN);
      setShowNewPlanForm(false);
      await fetchMealPlans();
      showSuccess("Meal plan created");
    } catch (err) { console.error("create plan:", err); showError("Could not create the meal plan"); }
  };

  const handleAddMeal = async (e) => {
    e?.preventDefault();
    if (!newMeal.name.trim() || !selectedPlan) return;
    try {
      const { error } = await supabase.from("meals").insert({
        meal_plan_id: selectedPlan.id,
        name: newMeal.name.trim(),
        meal_time: newMeal.meal_time,
        order_index: meals.length,
      });
      if (error) throw error;
      setNewMeal({ name: "", meal_time: "Breakfast" });
      setShowAddMeal(false);
      await fetchMeals(selectedPlan.id);
      showSuccess("Meal added");
    } catch (err) { console.error("add meal:", err); showError("Could not add the meal"); }
  };

  const handleAddFood = async (mealId) => {
    if (!selectedFood) return;
    const scale = servingSize / 100;
    try {
      const { error } = await supabase.from("meal_foods").insert({
        meal_id: mealId,
        food_name: selectedFood.food_name,
        brand: selectedFood.brand || null,
        serving_size_g: servingSize,
        calories: parseFloat((selectedFood.calories * scale).toFixed(1)),
        protein_g: parseFloat((selectedFood.protein_g * scale).toFixed(1)),
        carbs_g: parseFloat((selectedFood.carbs_g * scale).toFixed(1)),
        fats_g: parseFloat((selectedFood.fats_g * scale).toFixed(1)),
        open_food_facts_id: selectedFood.open_food_facts_id || null,
      });
      if (error) throw error;
      const name = selectedFood.food_name;
      resetFoodSearch();
      await fetchAllMealFoods(meals);
      showSuccess(`${name} added`);
    } catch (err) { console.error("add food:", err); showError("Could not add the food"); }
  };

  const handleAddManualFood = async (mealId) => {
    if (!manualFood.food_name.trim()) { showError("Food name is required"); return; }
    try {
      const { error } = await supabase.from("meal_foods").insert({
        meal_id: mealId,
        food_name: manualFood.food_name.trim(),
        brand: null,
        serving_size_g: parseFloat(manualFood.serving_size_g) || 100,
        calories: parseFloat(manualFood.calories) || 0,
        protein_g: parseFloat(manualFood.protein_g) || 0,
        carbs_g: parseFloat(manualFood.carbs_g) || 0,
        fats_g: parseFloat(manualFood.fats_g) || 0,
        open_food_facts_id: null,
      });
      if (error) throw error;
      const name = manualFood.food_name.trim();
      setManualFood(EMPTY_MANUAL);
      resetFoodSearch();
      await fetchAllMealFoods(meals);
      showSuccess(`${name} added`);
    } catch (err) { console.error("add manual food:", err); showError("Could not add the food"); }
  };

  const handleDeleteFood = async (foodId) => {
    try {
      const { error } = await supabase.from("meal_foods").delete().eq("id", foodId);
      if (error) throw error;
      await fetchAllMealFoods(meals);
    } catch (err) { console.error("delete food:", err); showError("Could not remove the food"); }
  };

  const openFoodSearch = (mealId) => {
    setActiveFoodMealId(mealId);
    setSelectedFood(null);
    setFoodQuery("");
    setFoodResults([]);
    setShowManualForm(false);
  };

  const resetFoodSearch = () => {
    setActiveFoodMealId(null);
    setFoodQuery("");
    setFoodResults([]);
    setSelectedFood(null);
    setServingSize(100);
    setShowManualForm(false);
    setManualFood(EMPTY_MANUAL);
  };

  const closeTemplate = () => { setShowMealModal(false); setTemplateFoods([]); };

  // ── Helpers ──
  const getClientName = (clientId) => clientId ? (clientNameMap[clientId] || null) : null;

  const filteredTemplates = mealTemplates.filter(t => {
    const catOk = selectedCategory === "All" || t.category === selectedCategory;
    const timeOk = selectedMealTime === "All" || t.meal_time === selectedMealTime;
    return catOk && timeOk;
  });

  const activeMeal = meals.find(m => m.id === activeFoodMealId);
  const planTotals = sumFoods(Object.values(mealFoods).flat());

  // ─── Sheets ───────────────────────────────────────────────────────────────

  const newPlanSheet = (
    <Sheet
      open={showNewPlanForm}
      onClose={() => setShowNewPlanForm(false)}
      title="New meal plan"
      footer={<Button type="submit" form="new-plan-form" size="lg" block disabled={!newPlan.name.trim()}>Create plan</Button>}
    >
      <form id="new-plan-form" onSubmit={handleCreatePlan} className="flex flex-col gap-4">
        <Field label="Plan name" autoFocus placeholder="e.g. Lean bulk" value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} />
        <Select label="Client" value={newPlan.client_id} onChange={e => setNewPlan(p => ({ ...p, client_id: e.target.value }))}>
          <option value="">Not assigned yet</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </Select>
        <div>
          <p className="text-sm font-semibold text-ink mb-1.5">Daily targets (optional)</p>
          <div className="grid grid-cols-4 gap-2.5">
            <MiniField label="kcal" type="number" inputMode="numeric" placeholder="2400" value={newPlan.daily_calories} onChange={e => setNewPlan(p => ({ ...p, daily_calories: e.target.value }))} />
            <MiniField label="Protein g" type="number" inputMode="numeric" placeholder="180" value={newPlan.protein_target_g} onChange={e => setNewPlan(p => ({ ...p, protein_target_g: e.target.value }))} />
            <MiniField label="Carbs g" type="number" inputMode="numeric" placeholder="250" value={newPlan.carbs_target_g} onChange={e => setNewPlan(p => ({ ...p, carbs_target_g: e.target.value }))} />
            <MiniField label="Fats g" type="number" inputMode="numeric" placeholder="70" value={newPlan.fats_target_g} onChange={e => setNewPlan(p => ({ ...p, fats_target_g: e.target.value }))} />
          </div>
        </div>
      </form>
    </Sheet>
  );

  const addMealSheet = (
    <Sheet
      open={showAddMeal}
      onClose={() => setShowAddMeal(false)}
      title="Add a meal"
      footer={<Button type="submit" form="add-meal-form" size="lg" block disabled={!newMeal.name.trim()}>Add meal</Button>}
    >
      <form id="add-meal-form" onSubmit={handleAddMeal} className="flex flex-col gap-4">
        <Field label="Meal name" autoFocus placeholder="e.g. Oats and berries" value={newMeal.name} onChange={e => setNewMeal(m => ({ ...m, name: e.target.value }))} />
        <Select label="When" value={newMeal.meal_time} onChange={e => setNewMeal(m => ({ ...m, meal_time: e.target.value }))}>
          {MEAL_TIMES.map(t => <option key={t} value={t}>{mealTimeLabel(t)}</option>)}
        </Select>
      </form>
    </Sheet>
  );

  const addFoodSheet = (
    <Sheet
      open={!!activeFoodMealId}
      onClose={resetFoodSearch}
      title={activeMeal ? `Add to ${activeMeal.name}` : "Add food"}
      footer={
        selectedFood ? (
          <Button size="lg" block onClick={() => handleAddFood(activeFoodMealId)} disabled={!servingSize}>Add to meal</Button>
        ) : showManualForm ? (
          <Button size="lg" block onClick={() => handleAddManualFood(activeFoodMealId)} disabled={!manualFood.food_name.trim()}>Add to meal</Button>
        ) : null
      }
    >
      {selectedFood ? (
        <div className="flex flex-col gap-4">
          <div className="p-3 rounded-[14px] bg-surface-2 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{selectedFood.food_name}</p>
              {selectedFood.brand && <p className="text-[13px] text-muted truncate">{selectedFood.brand}</p>}
            </div>
            <button type="button" onClick={() => setSelectedFood(null)} className="text-sm font-bold text-accent px-2 h-8 shrink-0">Change</button>
          </div>
          <div className="grid grid-cols-[110px_1fr] gap-4 items-end">
            <MiniField label="Serving (g)" type="number" inputMode="decimal" value={servingSize} onChange={e => setServingSize(Number(e.target.value))} />
            <div className="pb-1">
              <p className="font-display text-[28px] leading-none tabular-nums" style={{ color: "var(--kcal)" }}>
                {round((selectedFood.calories / 100) * servingSize)}<span className="font-sans text-sm font-semibold text-muted"> kcal</span>
              </p>
              <MacroLine
                className="mt-1.5"
                p={(selectedFood.protein_g / 100) * servingSize}
                c={(selectedFood.carbs_g / 100) * servingSize}
                f={(selectedFood.fats_g / 100) * servingSize}
              />
            </div>
          </div>
        </div>
      ) : showManualForm ? (
        <div className="flex flex-col gap-4">
          <Field label="Food" autoFocus placeholder="e.g. Chicken breast, grilled" value={manualFood.food_name} onChange={e => setManualFood(m => ({ ...m, food_name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2.5">
            <MiniField label="Serving (g)" type="number" inputMode="decimal" placeholder="100" value={manualFood.serving_size_g} onChange={e => setManualFood(m => ({ ...m, serving_size_g: e.target.value }))} />
            <MiniField label="kcal" type="number" inputMode="decimal" value={manualFood.calories} onChange={e => setManualFood(m => ({ ...m, calories: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <MiniField label="Protein g" type="number" inputMode="decimal" value={manualFood.protein_g} onChange={e => setManualFood(m => ({ ...m, protein_g: e.target.value }))} />
            <MiniField label="Carbs g" type="number" inputMode="decimal" value={manualFood.carbs_g} onChange={e => setManualFood(m => ({ ...m, carbs_g: e.target.value }))} />
            <MiniField label="Fats g" type="number" inputMode="decimal" value={manualFood.fats_g} onChange={e => setManualFood(m => ({ ...m, fats_g: e.target.value }))} />
          </div>
          <button type="button" onClick={() => setShowManualForm(false)} className="text-sm font-bold text-accent self-start">Search instead</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <SearchBox value={foodQuery} onChange={v => { setFoodQuery(v); setSelectedFood(null); }} placeholder="Search foods, e.g. chicken breast" autoFocus />
          {foodLoading ? (
            <Loading className="py-8" />
          ) : foodResults.length > 0 ? (
            <ul className="divide-y divide-line -mx-1">
              {foodResults.map((r, i) => (
                <li key={r.open_food_facts_id || i}>
                  <button
                    type="button"
                    onClick={() => { setSelectedFood(r); setServingSize(100); }}
                    className="w-full min-h-[56px] px-1 py-2 flex items-center justify-between gap-3 text-left hover:bg-surface-2 rounded-xl"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-ink truncate">{r.food_name}</span>
                      {r.brand && <span className="block text-[13px] text-muted truncate">{r.brand}</span>}
                    </span>
                    <span className="text-[13px] text-muted shrink-0 tabular-nums">{round(r.calories)} kcal / 100g</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : foodQuery.length >= 2 ? (
            <p className="text-sm text-muted text-center py-4">No foods found. Try another word, or enter it yourself.</p>
          ) : null}
          <Button variant="secondary" block onClick={() => setShowManualForm(true)}>Enter a food yourself</Button>
        </div>
      )}
    </Sheet>
  );

  const templateSheet = showMealModal && selectedMeal && (
    <Sheet open onClose={closeTemplate} title={selectedMeal.name}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {selectedMeal.meal_time && <Chip tone="accent">{mealTimeLabel(selectedMeal.meal_time)}</Chip>}
          {selectedMeal.category && <Chip>{selectedMeal.category}</Chip>}
          {selectedMeal.prep_time_minutes && <Chip><Clock size={12} /> {selectedMeal.prep_time_minutes} min</Chip>}
        </div>
        {selectedMeal.description && <p className="text-[15px] text-muted leading-relaxed -mt-2">{selectedMeal.description}</p>}

        <div>
          <SectionLabel>Per serving</SectionLabel>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { v: fmt(selectedMeal.total_calories), l: "kcal", c: "var(--kcal)" },
              { v: `${round(selectedMeal.total_protein_g)}g`, l: "Protein", c: "var(--protein)" },
              { v: `${round(selectedMeal.total_carbs_g)}g`, l: "Carbs", c: "var(--carbs)" },
              { v: `${round(selectedMeal.total_fats_g)}g`, l: "Fats", c: "var(--fats)" },
            ].map(m => (
              <div key={m.l} className="rounded-[14px] bg-surface-2 py-2.5">
                <p className="font-display text-[20px] leading-tight tabular-nums" style={{ color: m.c }}>{m.v}</p>
                <p className="text-xs text-muted">{m.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <MacroSplitBar p={selectedMeal.total_protein_g || 0} c={selectedMeal.total_carbs_g || 0} f={selectedMeal.total_fats_g || 0} />
          </div>
        </div>

        {templateFoods.length > 0 && (
          <div>
            <SectionLabel>Ingredients</SectionLabel>
            <ul className="divide-y divide-line px-1">
              {templateFoods.map((food, i) => (
                <li key={food.id ?? i} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[15px] text-ink truncate">{food.food_name}</span>
                    <span className="block text-[13px] text-muted">{food.serving_size_g}g</span>
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums shrink-0" style={{ color: "var(--kcal)" }}>{round(food.calories)} kcal</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedMeal.instructions && selectedMeal.instructions.trim().length > 0 && (
          <div>
            <SectionLabel>How to make it</SectionLabel>
            <ol className="flex flex-col gap-3">
              {selectedMeal.instructions
                .split(/(?=Step \d+:)/)
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .map((step, index) => {
                  const stepNum = step.match(/Step (\d+):/)?.[1] || index + 1;
                  const stepText = step.replace(/^Step \d+:\s*/, '');
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent-soft text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-px">{stepNum}</span>
                      <p className="text-[15px] text-ink leading-relaxed">{stepText}</p>
                    </li>
                  );
                })}
            </ol>
          </div>
        )}
      </div>
    </Sheet>
  );

  // ─── Views ────────────────────────────────────────────────────────────────

  const tabs = (
    <Segmented
      className="sm:max-w-md"
      value={activeTab}
      onChange={setActiveTab}
      options={[
        { value: "plans", label: "Meal plans" },
        { value: "library", label: "Meal ideas" },
        { value: "database", label: "Food lookup" },
      ]}
    />
  );

  // One plan open
  if (activeTab === "plans" && selectedPlan) {
    const clientName = getClientName(selectedPlan.client_id);
    const hasTargets = selectedPlan.daily_calories || selectedPlan.protein_target_g || selectedPlan.carbs_target_g || selectedPlan.fats_target_g;
    return (
      <div className="flex flex-col gap-5">
        <div>
          <BackLink onClick={() => setSelectedPlan(null)}>Meal plans</BackLink>
          <PageTitle
            className="mt-1 items-start [&_h1]:whitespace-normal [&_h1]:break-words"
            eyebrow={clientName ?? "Not assigned to a client"}
            title={selectedPlan.name}
            action={meals.length > 0 ? <Button onClick={() => setShowAddMeal(true)}><Plus size={18} /> Add meal</Button> : null}
          />
        </div>

        {/* Totals: what the meals add up to, against the plan's targets */}
        <Card className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4 sm:w-64 shrink-0">
            <Ring value={selectedPlan.daily_calories ? planTotals.calories / selectedPlan.daily_calories : 0} size={72} stroke={7} color="var(--kcal)">
              <span className="text-[11px] font-bold text-muted">kcal</span>
            </Ring>
            <div className="min-w-0">
              <p className="font-display text-[32px] leading-none text-ink tabular-nums">{fmt(planTotals.calories)}</p>
              <p className="text-[13px] text-muted mt-1">
                {selectedPlan.daily_calories ? `of ${fmt(selectedPlan.daily_calories)} kcal planned` : "kcal across all meals"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1">
            <MacroProgress label="Protein" color="var(--protein)" value={planTotals.protein_g} target={selectedPlan.protein_target_g} />
            <MacroProgress label="Carbs" color="var(--carbs)" value={planTotals.carbs_g} target={selectedPlan.carbs_target_g} />
            <MacroProgress label="Fats" color="var(--fats)" value={planTotals.fats_g} target={selectedPlan.fats_target_g} />
          </div>
        </Card>
        {!hasTargets && <p className="text-[13px] text-muted -mt-3 px-1">This plan has no daily targets, so totals show what the meals add up to.</p>}

        {mealsLoading ? (
          <Loading />
        ) : meals.length === 0 ? (
          <Card>
            <EmptyState
              icon={Utensils}
              title="No meals yet"
              body="Add breakfast, lunch, dinner and snacks, then fill each with foods."
              action={<Button onClick={() => setShowAddMeal(true)}><Plus size={18} /> Add meal</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 items-start">
            {meals.map(meal => {
              const foods = mealFoods[meal.id] || [];
              const t = sumFoods(foods);
              return (
                <Card key={meal.id} padded={false} className="overflow-hidden">
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">{mealTimeLabel(meal.meal_time)}</p>
                      <h2 className="text-[17px] font-bold text-ink truncate">{meal.name}</h2>
                    </div>
                    {foods.length > 0 && (
                      <div className="text-right shrink-0">
                        <p className="font-display text-[20px] leading-tight tabular-nums" style={{ color: "var(--kcal)" }}>
                          {fmt(t.calories)}<span className="font-sans text-xs font-semibold text-muted"> kcal</span>
                        </p>
                        <MacroLine p={t.protein_g} c={t.carbs_g} f={t.fats_g} dp={0} className="text-xs" />
                      </div>
                    )}
                  </div>
                  {foods.length > 0 && (
                    <ul className="divide-y divide-line border-t border-line">
                      {foods.map(food => (
                        <li key={food.id} className="pl-4 pr-2 py-2.5 flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold text-ink truncate">
                              {food.food_name}
                              {food.brand && <span className="font-normal text-muted"> · {food.brand}</span>}
                            </p>
                            <p className="text-[13px] text-muted tabular-nums">
                              {round(food.serving_size_g)}g · {round(food.calories)} kcal · <MacroLine p={food.protein_g} c={food.carbs_g} f={food.fats_g} className="text-xs" />
                            </p>
                          </div>
                          <ConfirmRemove icon={X} label={`Remove ${food.food_name}`} confirmLabel="Remove" onConfirm={() => handleDeleteFood(food.id)} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className={foods.length > 0 ? "border-t border-line" : ""}>
                    <button
                      type="button"
                      onClick={() => openFoodSearch(meal.id)}
                      className="w-full h-12 px-4 flex items-center gap-2 text-[15px] font-bold text-accent hover:bg-surface-2"
                    >
                      <Plus size={18} /> Add food
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {addMealSheet}
        {addFoodSheet}
        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Nutrition"
        action={activeTab === "plans" ? <Button onClick={() => { setNewPlan(EMPTY_PLAN); setShowNewPlanForm(true); }}><Plus size={18} /> New plan</Button> : null}
      />
      {tabs}

      {/* ── Meal plans ── */}
      {activeTab === "plans" && (
        plansLoading ? (
          <Loading />
        ) : mealPlans.length === 0 ? (
          <Card>
            <EmptyState
              icon={Utensils}
              title="No meal plans yet"
              body="Set daily targets for a client, then build their meals."
              action={<Button onClick={() => setShowNewPlanForm(true)}><Plus size={18} /> New plan</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mealPlans.map(plan => {
              const clientName = getClientName(plan.client_id);
              return (
                <Card key={plan.id} as="button" onClick={() => setSelectedPlan(plan)} className="flex items-center gap-3 min-h-[88px]">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold text-ink truncate">{plan.name}</span>
                    <span className="block text-[13px] text-muted truncate">{clientName ?? "Not assigned"}</span>
                    {plan.daily_calories ? (
                      <span className="flex flex-wrap items-center gap-x-2 mt-1 text-[13px] font-semibold tabular-nums">
                        <span style={{ color: "var(--kcal)" }}>{fmt(plan.daily_calories)} kcal</span>
                        {MACROS.map(m => {
                          const v = plan[m.key.replace("_g", "_target_g")];
                          return v ? <span key={m.key} style={{ color: m.color }}>{v}g {m.short}</span> : null;
                        })}
                      </span>
                    ) : (
                      <span className="block text-[13px] text-faint mt-1">No daily targets</span>
                    )}
                  </span>
                  <ChevronRight size={20} className="text-faint shrink-0" />
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ── Meal ideas ── */}
      {activeTab === "library" && (
        <>
          {(templateCategories.length > 1 || mealTemplates.length > 0) && (
            <div className="flex flex-col gap-2">
              {templateCategories.length > 2 && (
                <FilterChips options={templateCategories} value={selectedCategory} onChange={setSelectedCategory} />
              )}
              <FilterChips
                options={[{ label: "Any time", value: "All" }, "Breakfast", "Lunch", "Dinner", "Snack"]}
                value={selectedMealTime}
                onChange={setSelectedMealTime}
              />
            </div>
          )}
          {templatesLoading ? (
            <Loading />
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <EmptyState
                icon={BookOpen}
                title={mealTemplates.length === 0 ? "No meal ideas yet" : "Nothing for these filters"}
                body={mealTemplates.length === 0 ? "Meal ideas will show here once they are added to the library." : "Try another meal time or category."}
                action={mealTemplates.length > 0 ? <Button variant="secondary" onClick={() => { setSelectedCategory("All"); setSelectedMealTime("All"); }}>Show all</Button> : null}
              />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTemplates.map(t => (
                <Card key={t.id} as="button" onClick={() => { setSelectedMeal(t); setShowMealModal(true); }} className="flex flex-col gap-3">
                  <span className="flex items-center gap-2 flex-wrap">
                    {t.meal_time && <Chip tone="accent">{mealTimeLabel(t.meal_time)}</Chip>}
                    {t.category && <Chip>{t.category}</Chip>}
                    {t.prep_time_minutes && <span className="text-[13px] text-muted inline-flex items-center gap-1"><Clock size={13} /> {t.prep_time_minutes} min</span>}
                  </span>
                  <span>
                    <span className="block text-[17px] font-bold text-ink leading-snug">{t.name}</span>
                    {t.description && <span className="block text-[13px] text-muted mt-1 line-clamp-2">{t.description}</span>}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 text-[13px] font-semibold tabular-nums mt-auto">
                    <span style={{ color: "var(--kcal)" }}>{fmt(t.total_calories)} kcal</span>
                    <MacroLine p={t.total_protein_g} c={t.total_carbs_g} f={t.total_fats_g} dp={0} />
                  </span>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Food lookup ── */}
      {activeTab === "database" && (
        <div className="flex flex-col gap-4 max-w-3xl">
          <SearchBox value={dbQuery} onChange={setDbQuery} placeholder="Look up a food, e.g. oats, banana" />
          {dbLoading ? (
            <Loading />
          ) : !dbSearched ? (
            <Card>
              <EmptyState icon={Search} title="Look up any food" body="Type at least 3 letters to see calories and macros per 100g." />
            </Card>
          ) : dbResults.length === 0 ? (
            <Card>
              <EmptyState icon={Search} title="No results" body="Try a different word or a simpler name." />
            </Card>
          ) : (
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-line">
                {dbResults.map((r, i) => {
                  const key = r.code || i;
                  const servSz = dbServingSizes[key] ?? 100;
                  const scale = servSz / 100;
                  return (
                    <li key={key} className="px-4 py-3.5 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-ink">{r.food_name}</p>
                          {r.brand && <p className="text-[13px] text-muted truncate">{r.brand}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-[20px] leading-tight tabular-nums" style={{ color: "var(--kcal)" }}>
                            {round(r.calories * scale)}<span className="font-sans text-xs font-semibold text-muted"> kcal</span>
                          </p>
                        </div>
                      </div>
                      <MacroSplitBar p={r.protein_g} c={r.carbs_g} f={r.fats_g} />
                      <div className="flex items-center justify-between gap-3">
                        <MacroLine p={r.protein_g * scale} c={r.carbs_g * scale} f={r.fats_g * scale} />
                        <label className="flex items-center gap-1.5 text-[13px] text-muted shrink-0">
                          per
                          <input
                            type="number"
                            inputMode="decimal"
                            value={servSz}
                            onChange={e => setDbServingSizes(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                            className="w-16 h-9 rounded-[10px] border border-line-strong bg-surface text-ink text-center font-bold tabular-nums outline-none focus:border-accent"
                          />
                          g
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}

      {newPlanSheet}
      {templateSheet}
      <Toast toast={toast} />
    </div>
  );
}
