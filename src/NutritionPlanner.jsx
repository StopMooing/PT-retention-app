import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Search, Plus, X, ChevronRight, Utensils, BookOpen, Database, CheckCircle2, Flame, Beef, Wheat, Droplets, Clock } from "lucide-react";

export default function NutritionPlanner() {
  const [activeTab, setActiveTab] = useState("plans");
  const [userId, setUserId] = useState(null);

  // ── Tab 1: Meal Plans ──
  const [clients, setClients] = useState([]);
  const [clientNameMap, setClientNameMap] = useState({});
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: "", client_id: "", daily_calories: "", protein_target_g: "", carbs_target_g: "", fats_target_g: "" });
  const [meals, setMeals] = useState([]);
  const [mealFoods, setMealFoods] = useState({});
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: "", meal_time: "Breakfast" });
  const [plansLoading, setPlansLoading] = useState(false);
  const [mealsLoading, setMealsLoading] = useState(false);

  // Food search (one active meal at a time)
  const [activeFoodMealId, setActiveFoodMealId] = useState(null);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingSize, setServingSize] = useState(100);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFood, setManualFood] = useState({ food_name: "", serving_size_g: "", calories: "", protein_g: "", carbs_g: "", fats_g: "" });

  // ── Tab 2: Meal Library ──
  const [mealTemplates, setMealTemplates] = useState([]);
  const [templateCategories, setTemplateCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMealTime, setSelectedMealTime] = useState("All");
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [templateFoods, setTemplateFoods] = useState([]);

  // ── Tab 3: Food Database ──
  const [dbQuery, setDbQuery] = useState("");
  const [dbResults, setDbResults] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbSearched, setDbSearched] = useState(false);
  const [dbServingSizes, setDbServingSizes] = useState({});

  // ── UI feedback ──
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(""), 3000); };
  const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(""), 4000); };

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
  }, [selectedPlan?.id]);

  // ── Fetch meal templates ──
  useEffect(() => {
    if (activeTab !== "library") return;
    const run = async () => {
      try {
        const { data, error } = await supabase.from("meal_templates").select("*");
        if (error) throw error;
        setMealTemplates(data || []);
        const cats = ["All", ...new Set((data || []).map(t => t.category).filter(Boolean))];
        setTemplateCategories(cats);
      } catch (err) { console.error("fetch templates:", err); }
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
  }, [showMealModal]);

  // ── Debounced food search (meal plans) ──
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

  // ── Debounced food database search ──
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
  const handleCreatePlan = async () => {
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
      setNewPlan({ name: "", client_id: "", daily_calories: "", protein_target_g: "", carbs_target_g: "", fats_target_g: "" });
      setShowNewPlanForm(false);
      await fetchMealPlans();
      showSuccess("Meal plan created!");
    } catch (err) { console.error("create plan:", err); showError("Failed to create meal plan"); }
  };

  const handleAddMeal = async () => {
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
      showSuccess("Meal added!");
    } catch (err) { console.error("add meal:", err); showError("Failed to add meal"); }
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
      resetFoodSearch();
      await fetchAllMealFoods(meals);
      showSuccess("Food added!");
    } catch (err) { console.error("add food:", err); showError("Failed to add food"); }
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
      setManualFood({ food_name: "", serving_size_g: "", calories: "", protein_g: "", carbs_g: "", fats_g: "" });
      resetFoodSearch();
      await fetchAllMealFoods(meals);
      showSuccess("Food added!");
    } catch (err) { console.error("add manual food:", err); showError("Failed to add food"); }
  };

  const handleDeleteFood = async (foodId) => {
    try {
      const { error } = await supabase.from("meal_foods").delete().eq("id", foodId);
      if (error) throw error;
      await fetchAllMealFoods(meals);
    } catch (err) { console.error("delete food:", err); showError("Failed to remove food"); }
  };

  const resetFoodSearch = () => {
    setActiveFoodMealId(null);
    setFoodQuery("");
    setFoodResults([]);
    setSelectedFood(null);
    setServingSize(100);
    setShowManualForm(false);
    setManualFood({ food_name: "", serving_size_g: "", calories: "", protein_g: "", carbs_g: "", fats_g: "" });
  };

  // ── Helpers ──
  const getMealTotalCals = (mealId) =>
    (mealFoods[mealId] || []).reduce((s, f) => s + (f.calories || 0), 0).toFixed(0);

  const getClientName = (clientId) => clientId ? (clientNameMap[clientId] || null) : null;

  const filteredTemplates = mealTemplates.filter(t => {
    const catOk = selectedCategory === "All" || t.category === selectedCategory;
    const timeOk = selectedMealTime === "All" || t.meal_time === selectedMealTime;
    return catOk && timeOk;
  });

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

  // ─── RENDER ───
  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* Toast messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* ── Header + Tab Navigation ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="text-2xl font-bold text-gray-900">Nutrition Planner</div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mt-3">
          {[
            { id: "plans", label: "Meal Plans", icon: <Utensils size={14} className="mr-1.5" /> },
            { id: "library", label: "Meal Library", icon: <BookOpen size={14} className="mr-1.5" /> },
            { id: "database", label: "Food Database", icon: <Database size={14} className="mr-1.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB 1 — MEAL PLANS
      ══════════════════════════════════════ */}
      {activeTab === "plans" && (
        <div className="flex flex-col md:flex-row flex-1 min-h-0">

          {/* LEFT PANEL */}
          <div className={`${selectedPlan ? 'hidden md:flex' : 'flex'} w-full md:w-[280px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-col overflow-y-auto`}>

            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Meal Plans</span>
              <button
                onClick={() => setShowNewPlanForm(true)}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                <Plus size={12} /> New Plan
              </button>
            </div>

            {/* New Plan Form */}
            {showNewPlanForm && (
              <div className="border border-gray-200 rounded-xl mx-3 mt-3 p-4 shadow-sm">
                <div className="text-sm font-bold text-gray-800 mb-3">New Meal Plan</div>

                <div className="mb-2">
                  <label className={labelCls}>Plan Name</label>
                  <input className={inputCls} placeholder="e.g. 12 Week Bulk Plan" value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} />
                </div>

                <div className="mb-2">
                  <label className={labelCls}>Assign to Client</label>
                  <select className={inputCls} value={newPlan.client_id} onChange={e => setNewPlan(p => ({ ...p, client_id: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>

                <div className="mb-2">
                  <label className={labelCls}>Daily Calories</label>
                  <input className={inputCls} type="number" placeholder="e.g. 2400" value={newPlan.daily_calories} onChange={e => setNewPlan(p => ({ ...p, daily_calories: e.target.value }))} />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className={labelCls}>Protein (g)</label>
                    <input className={inputCls} type="number" placeholder="180" value={newPlan.protein_target_g} onChange={e => setNewPlan(p => ({ ...p, protein_target_g: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Carbs (g)</label>
                    <input className={inputCls} type="number" placeholder="250" value={newPlan.carbs_target_g} onChange={e => setNewPlan(p => ({ ...p, carbs_target_g: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Fats (g)</label>
                    <input className={inputCls} type="number" placeholder="70" value={newPlan.fats_target_g} onChange={e => setNewPlan(p => ({ ...p, fats_target_g: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={handleCreatePlan} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg w-full transition">
                    Create Plan
                  </button>
                  <button onClick={() => setShowNewPlanForm(false)} className="border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm px-3 py-2 rounded-lg shrink-0 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Plan List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {plansLoading ? (
                <div className="text-sm text-gray-400 animate-pulse text-center pt-6">Loading plans...</div>
              ) : mealPlans.length === 0 ? (
                <div className="text-center pt-8">
                  <div className="text-gray-400 text-sm">No meal plans yet</div>
                  <div className="text-gray-300 text-xs mt-1">Click + New Plan to get started</div>
                </div>
              ) : (
                mealPlans.map(plan => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const clientName = getClientName(plan.client_id);
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "border-l-4 border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{plan.name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {clientName
                          ? <span className="text-xs text-gray-500">{clientName}</span>
                          : <span className="text-xs text-gray-400 italic">Unassigned</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {plan.daily_calories ? `${plan.daily_calories} kcal/day` : "No target set"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className={`${!selectedPlan ? 'hidden md:block' : 'block'} flex-1 bg-gray-50 overflow-y-auto`}>
            {!selectedPlan ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-green-100 rounded-2xl p-8 text-center max-w-sm mx-auto">
                  <Utensils size={32} className="text-green-400 mx-auto mb-3" />
                  <div className="text-gray-600 font-medium">Select a meal plan</div>
                  <div className="text-sm text-gray-400 mt-1">Choose a plan from the left to view and edit its meals</div>
                </div>
              </div>
            ) : (
              <>
                {/* Plan Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-5">
                  <div className="text-xl font-bold text-gray-900">{selectedPlan.name}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {getClientName(selectedPlan.client_id)
                      ? `Assigned to: ${getClientName(selectedPlan.client_id)}`
                      : "Unassigned"}
                  </div>
                  <div className="flex gap-4 mt-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                      <Flame size={16} className="text-orange-500" />
                      <span className="text-lg font-black text-gray-900">{selectedPlan.daily_calories ?? "—"}</span>
                      <span className="text-xs text-gray-500">kcal</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                      <Beef size={16} className="text-red-500" />
                      <span className="text-lg font-black text-gray-900">{selectedPlan.protein_target_g ?? "—"}g</span>
                      <span className="text-xs text-gray-500">protein</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                      <Wheat size={16} className="text-yellow-500" />
                      <span className="text-lg font-black text-gray-900">{selectedPlan.carbs_target_g ?? "—"}g</span>
                      <span className="text-xs text-gray-500">carbs</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                      <Droplets size={16} className="text-blue-500" />
                      <span className="text-lg font-black text-gray-900">{selectedPlan.fats_target_g ?? "—"}g</span>
                      <span className="text-xs text-gray-500">fats</span>
                    </div>
                  </div>
                </div>

                {/* Meals Section */}
                <div className="px-6 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-bold text-gray-800">Meals</span>
                    <button
                      onClick={() => setShowAddMeal(true)}
                      className="border border-green-600 text-green-600 hover:bg-green-50 text-sm px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition"
                    >
                      <Plus size={14} /> Add Meal
                    </button>
                  </div>

                  {/* Add Meal Form */}
                  {showAddMeal && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                      <div className="mb-2">
                        <label className={labelCls}>Meal Name</label>
                        <input className={inputCls} placeholder="e.g. Breakfast" value={newMeal.name} onChange={e => setNewMeal(m => ({ ...m, name: e.target.value }))} />
                      </div>
                      <div className="mb-2">
                        <label className={labelCls}>Meal Time</label>
                        <select className={inputCls} value={newMeal.meal_time} onChange={e => setNewMeal(m => ({ ...m, meal_time: e.target.value }))}>
                          {["Breakfast","Morning Snack","Lunch","Afternoon Snack","Dinner","Evening Snack","Pre-Workout","Post-Workout"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center mt-3">
                        <button onClick={handleAddMeal} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition">
                          Add Meal
                        </button>
                        <button onClick={() => setShowAddMeal(false)} className="text-gray-500 text-sm ml-3 hover:text-gray-700 transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {mealsLoading ? (
                    <div className="text-sm text-gray-400 animate-pulse text-center py-8">Loading meals...</div>
                  ) : (
                    meals.map(meal => {
                      const foods = mealFoods[meal.id] || [];
                      const isFoodSearchOpen = activeFoodMealId === meal.id;

                      return (
                        <div key={meal.id} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm">

                          {/* Meal Card Header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center">
                              <span className="font-semibold text-gray-900 text-sm">{meal.name}</span>
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full ml-2 font-medium">{meal.meal_time}</span>
                            </div>
                            <span className="text-xs text-gray-500">{getMealTotalCals(meal.id)} kcal</span>
                          </div>

                          {/* Foods List */}
                          <div className="px-4 py-2">
                            {foods.length === 0 ? (
                              <div className="text-xs text-gray-400 italic py-2">No foods added yet</div>
                            ) : (
                              foods.map(food => (
                                <div key={food.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                  <div className="flex items-center min-w-0 flex-1">
                                    <span className="text-sm text-gray-800 font-medium truncate">{food.food_name}</span>
                                    {food.brand && <span className="text-xs text-gray-400 ml-1 shrink-0">· {food.brand}</span>}
                                  </div>
                                  <div className="flex items-center shrink-0 ml-3 gap-1">
                                    <span className="text-xs text-gray-400">{food.serving_size_g}g</span>
                                    <span className="text-xs text-gray-600 font-medium ml-2">{food.calories} kcal</span>
                                    <span className="text-xs text-red-500 font-medium ml-2">{food.protein_g}g P</span>
                                    <span className="text-xs text-yellow-500 font-medium ml-2">{food.carbs_g}g C</span>
                                    <span className="text-xs text-blue-500 font-medium ml-2">{food.fats_g}g F</span>
                                    <button onClick={() => handleDeleteFood(food.id)} className="ml-3 text-gray-300 hover:text-red-400 transition">
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add Food */}
                          <div className="px-4 pb-4">
                            {!isFoodSearchOpen ? (
                              <button
                                onClick={() => {
                                  setActiveFoodMealId(meal.id);
                                  setSelectedFood(null);
                                  setFoodQuery("");
                                  setFoodResults([]);
                                  setShowManualForm(false);
                                }}
                                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition"
                              >
                                <Plus size={12} /> Add Food
                              </button>
                            ) : (
                              <div className="bg-gray-50 rounded-xl p-3 mt-2 border border-gray-200">

                                {/* Search input */}
                                <div className="relative mb-2">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    autoFocus
                                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                    placeholder="Search foods e.g. chicken breast..."
                                    value={foodQuery}
                                    onChange={e => { setFoodQuery(e.target.value); setSelectedFood(null); }}
                                  />
                                </div>

                                {foodLoading && (
                                  <div className="text-xs text-gray-400 text-center py-2 animate-pulse">Searching...</div>
                                )}

                                {/* Search Results Dropdown */}
                                {!selectedFood && !foodLoading && foodResults.length > 0 && (
                                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                                    {foodResults.map((r, i) => (
                                      <div
                                        key={i}
                                        onClick={() => { setSelectedFood(r); setServingSize(100); }}
                                        className="flex items-center justify-between px-3 py-2.5 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0"
                                      >
                                        <div className="min-w-0">
                                          <div className="text-sm text-gray-900 font-medium truncate">{r.food_name}</div>
                                          {r.brand && <div className="text-xs text-gray-400 truncate">{r.brand}</div>}
                                        </div>
                                        <div className="text-xs text-gray-500 shrink-0 ml-2">{r.calories.toFixed(0)} kcal / 100g</div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Selected food + serving size form */}
                                {selectedFood && (
                                  <div className="bg-white border border-gray-200 rounded-xl p-3 mt-2">
                                    <div className="text-sm text-gray-700 font-medium">{selectedFood.food_name}</div>
                                    {selectedFood.brand && <div className="text-xs text-gray-400 mt-0.5">{selectedFood.brand}</div>}
                                    <div className="flex items-center gap-2 mt-3">
                                      <label className="text-xs text-gray-500 shrink-0">Serving size (g)</label>
                                      <input
                                        type="number"
                                        value={servingSize}
                                        onChange={e => setServingSize(Number(e.target.value))}
                                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-green-400 focus:outline-none"
                                      />
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {((selectedFood.calories / 100) * servingSize).toFixed(0)} kcal ·{" "}
                                      {((selectedFood.protein_g / 100) * servingSize).toFixed(1)}g P ·{" "}
                                      {((selectedFood.carbs_g / 100) * servingSize).toFixed(1)}g C ·{" "}
                                      {((selectedFood.fats_g / 100) * servingSize).toFixed(1)}g F
                                    </div>
                                    <button
                                      onClick={() => handleAddFood(meal.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-medium w-full mt-3 transition"
                                    >
                                      Add to Meal
                                    </button>
                                  </div>
                                )}

                                {/* Manual entry toggle */}
                                {!showManualForm ? (
                                  <button
                                    onClick={() => setShowManualForm(true)}
                                    className="text-xs text-gray-400 hover:text-gray-600 mt-2 block transition"
                                  >
                                    Add manually
                                  </button>
                                ) : (
                                  <div className="bg-white border border-gray-200 rounded-xl p-3 mt-2 space-y-2">
                                    <div className="text-xs font-semibold text-gray-600 mb-1">Manual Entry</div>
                                    <input className={inputCls} placeholder="Food name" value={manualFood.food_name} onChange={e => setManualFood(m => ({ ...m, food_name: e.target.value }))} />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input className={inputCls} type="number" placeholder="Serving size (g)" value={manualFood.serving_size_g} onChange={e => setManualFood(m => ({ ...m, serving_size_g: e.target.value }))} />
                                      <input className={inputCls} type="number" placeholder="Calories" value={manualFood.calories} onChange={e => setManualFood(m => ({ ...m, calories: e.target.value }))} />
                                      <input className={inputCls} type="number" placeholder="Protein (g)" value={manualFood.protein_g} onChange={e => setManualFood(m => ({ ...m, protein_g: e.target.value }))} />
                                      <input className={inputCls} type="number" placeholder="Carbs (g)" value={manualFood.carbs_g} onChange={e => setManualFood(m => ({ ...m, carbs_g: e.target.value }))} />
                                      <input className={inputCls} type="number" placeholder="Fats (g)" value={manualFood.fats_g} onChange={e => setManualFood(m => ({ ...m, fats_g: e.target.value }))} />
                                    </div>
                                    <button
                                      onClick={() => handleAddManualFood(meal.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-medium w-full transition"
                                    >
                                      Add
                                    </button>
                                  </div>
                                )}

                                <button
                                  onClick={resetFoodSearch}
                                  className="text-xs text-gray-400 hover:text-gray-600 mt-2 block transition"
                                >
                                  Cancel search
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 2 — MEAL LIBRARY
      ══════════════════════════════════════ */}
      {activeTab === "library" && (
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="text-xl font-bold text-gray-900">Meal Inspiration Library</div>
              <div className="text-sm text-gray-500 mt-1">Browse our curated collection of meals to inspire your clients</div>
            </div>
            <div>
              <div className="flex gap-2 flex-wrap">
                {templateCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-sm px-4 py-2 rounded-full font-medium transition ${
                      selectedCategory === cat ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { label: "All Times", val: "All" },
                  { label: "Breakfast", val: "Breakfast" },
                  { label: "Lunch", val: "Lunch" },
                  { label: "Dinner", val: "Dinner" },
                  { label: "Snack", val: "Snack" },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    onClick={() => setSelectedMealTime(val)}
                    className={`text-sm px-4 py-2 rounded-full font-medium transition ${
                      selectedMealTime === val ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No meal templates found for these filters</div>
          ) : (
            <div className="grid grid-cols-3 gap-5 mt-6">
              {filteredTemplates.map(t => (
                <div
                  key={t.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-200 cursor-pointer"
                  onClick={() => { setSelectedMeal(t); setShowMealModal(true); }}
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">{t.meal_time}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">{t.category}</span>
                  </div>
                  <div className="mt-3 text-base font-bold text-gray-900 leading-snug">{t.name}</div>
                  <div className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">{t.description}</div>
                  <div className="border-t border-gray-100 mt-4 pt-4">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-orange-500">{t.total_calories}</span>
                        <span className="text-xs text-gray-400 mt-0.5">kcal</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-red-500">{t.total_protein_g}g</span>
                        <span className="text-xs text-gray-400 mt-0.5">protein</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-yellow-500">{t.total_carbs_g}g</span>
                        <span className="text-xs text-gray-400 mt-0.5">carbs</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-blue-500">{t.total_fats_g}g</span>
                        <span className="text-xs text-gray-400 mt-0.5">fats</span>
                      </div>
                    </div>
                  </div>
                  {t.prep_time_minutes && (
                    <div className="border-t border-gray-100 mt-3 pt-3 flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{t.prep_time_minutes} min prep</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 3 — FOOD DATABASE
      ══════════════════════════════════════ */}
      {activeTab === "database" && (
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="text-xl font-bold text-gray-900">Food Database</div>
          <div className="text-sm text-gray-500 mt-1">Search millions of foods for nutrition information</div>

          <div className="mt-6 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={dbQuery}
              onChange={e => setDbQuery(e.target.value)}
              placeholder="Search foods e.g. chicken breast, oats, banana..."
              className="w-full border border-gray-300 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent shadow-sm pl-12"
            />
          </div>

          {dbLoading && (
            <div className="text-sm text-gray-400 text-center mt-8 animate-pulse">Searching foods...</div>
          )}

          {!dbLoading && !dbSearched && (
            <div className="text-center mt-16">
              <Database size={40} className="text-gray-300 mx-auto mb-4" />
              <div className="text-gray-400 font-medium">Search for any food</div>
              <div className="text-sm text-gray-300 mt-1">Type at least 3 characters to search millions of foods</div>
            </div>
          )}

          {!dbLoading && dbSearched && dbResults.length === 0 && (
            <div className="text-sm text-gray-400 text-center mt-8">No results found. Try a different search term.</div>
          )}

          {!dbLoading && dbResults.length > 0 && (
            <div className="mt-6 space-y-3">
              {dbResults.map((r, i) => {
                const key = r.code || i;
                const servSz = dbServingSizes[key] ?? 100;
                const scale = servSz / 100;
                const total = r.protein_g + r.carbs_g + r.fats_g;
                const pPct = total > 0 ? (r.protein_g / total) * 100 : 0;
                const cPct = total > 0 ? (r.carbs_g / total) * 100 : 0;
                const fPct = total > 0 ? (r.fats_g / total) * 100 : 0;

                return (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-green-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-bold text-gray-900">{r.food_name}</div>
                        {r.brand && <div className="text-sm text-gray-400 mt-0.5">{r.brand}</div>}
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full shrink-0 ml-3">
                        {r.calories.toFixed(0)} kcal
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Protein</span><span>Carbs</span><span>Fats</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-red-500">{r.protein_g.toFixed(1)}g</span>
                        <span className="text-yellow-500">{r.carbs_g.toFixed(1)}g</span>
                        <span className="text-blue-500">{r.fats_g.toFixed(1)}g</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
                        <div className="bg-red-400 h-full transition-all" style={{ width: `${pPct}%` }} />
                        <div className="bg-yellow-400 h-full transition-all" style={{ width: `${cPct}%` }} />
                        <div className="bg-blue-400 h-full transition-all" style={{ width: `${fPct}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Calculate for serving size:</span>
                      <input
                        type="number"
                        value={servSz}
                        onChange={e => setDbServingSizes(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-green-400 focus:outline-none"
                      />
                      <span className="text-xs text-gray-500">g</span>
                      <span className="text-xs text-gray-600 ml-1">
                        {(r.calories * scale).toFixed(0)} kcal · {(r.protein_g * scale).toFixed(1)}g P · {(r.carbs_g * scale).toFixed(1)}g C · {(r.fats_g * scale).toFixed(1)}g F
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      )}

      {/* ── Meal Library Modal ── */}
      {showMealModal && selectedMeal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => { setShowMealModal(false); setTemplateFoods([]); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">{selectedMeal.meal_time}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">{selectedMeal.category}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{selectedMeal.name}</div>
                </div>
                <button
                  onClick={() => { setShowMealModal(false); setTemplateFoods([]); }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition shrink-0 ml-4 mt-1"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              {selectedMeal.description && (
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">{selectedMeal.description}</p>
              )}
            </div>

            {/* Macro Summary */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Nutrition per serving</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: selectedMeal.total_calories, label: "kcal", color: "text-orange-500" },
                  { value: `${selectedMeal.total_protein_g}g`, label: "protein", color: "text-red-500" },
                  { value: `${selectedMeal.total_carbs_g}g`, label: "carbs", color: "text-yellow-500" },
                  { value: `${selectedMeal.total_fats_g}g`, label: "fats", color: "text-blue-500" },
                ].map(m => (
                  <div key={m.label} className="bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm">
                    <div className={`text-xl font-black ${m.color}`}>{m.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              {(() => {
                const total = (selectedMeal.total_protein_g || 0) + (selectedMeal.total_carbs_g || 0) + (selectedMeal.total_fats_g || 0);
                return total > 0 ? (
                  <>
                    <div className="mt-3 h-2.5 rounded-full bg-gray-200 overflow-hidden flex">
                      <div className="bg-red-400 h-full" style={{ width: `${(selectedMeal.total_protein_g / total) * 100}%` }} />
                      <div className="bg-yellow-400 h-full" style={{ width: `${(selectedMeal.total_carbs_g / total) * 100}%` }} />
                      <div className="bg-blue-400 h-full" style={{ width: `${(selectedMeal.total_fats_g / total) * 100}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2">
                      {[
                        { dot: "bg-red-400", label: "Protein" },
                        { dot: "bg-yellow-400", label: "Carbs" },
                        { dot: "bg-blue-400", label: "Fats" },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                          <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null;
              })()}
            </div>

            {/* Ingredients */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-800">Ingredients</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{templateFoods.length} items</span>
              </div>
              {templateFoods.length === 0 ? (
                <div className="text-center text-sm text-gray-400 italic py-4">No ingredients listed for this meal.</div>
              ) : (
                <div className="space-y-1">
                  {templateFoods.map((food, i) => (
                    <div key={food.id ?? i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors duration-100">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-800 font-medium leading-tight">{food.food_name}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{food.serving_size_g}g per serving</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{food.calories} kcal</span>
                        <span className="text-xs text-gray-400 hidden sm:block">P{food.protein_g} · C{food.carbs_g} · F{food.fats_g}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preparation Instructions */}
            {selectedMeal.instructions && selectedMeal.instructions.trim().length > 0 && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-green-500" />
                    <span className="text-sm font-bold text-gray-800">How to Prepare</span>
                    {selectedMeal.prep_time_minutes && (
                      <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock size={11} className="text-gray-400" />
                        {selectedMeal.prep_time_minutes} min
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {selectedMeal.instructions
                      .split(/(?=Step \d+:)/)
                      .map(s => s.trim())
                      .filter(s => s.length > 0)
                      .map((step, index) => {
                        const stepNum = step.match(/Step (\d+):/)?.[1] || index + 1;
                        const stepText = step.replace(/^Step \d+:\s*/, '');
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {stepNum}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{stepText}</p>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowMealModal(false); setTemplateFoods([]); }}
                  className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-100 font-medium py-2.5 rounded-xl text-sm transition"
                >
                  Close
                </button>
                <button
                  onClick={() => { setShowMealModal(false); setTemplateFoods([]); alert("Coming soon — assign this meal to a plan from the Meal Plans tab"); }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  Save to My Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
