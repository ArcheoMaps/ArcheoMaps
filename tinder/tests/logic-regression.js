/* Fast, browser-independent checks for the import/state invariants that are
   easiest to regress. This executes the real inline application code in a
   sandbox with inert DOM shims; it does not maintain a second implementation. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
source = source.replace(/\nboot\(\);\n/, "\n");
source = source.replace(/\n\}\)\(\);\s*$/, `
globalThis.__curatorTest = {
  freshState, validateBundle, validateFullState, normalizeFullState,
  competingGroupKey, resolvedDecisionFor, makeDict, hasOwn
};
})();`);

const inert = new Proxy(function(){}, {
  get(_target, prop){
    if(prop === "style" || prop === "dataset") return {};
    if(prop === "classList") return {add(){}, remove(){}, toggle(){}};
    if(prop === "querySelectorAll") return () => [];
    if(prop === "querySelector") return () => inert;
    if(prop === "getContext") return () => ({});
    return inert;
  },
  apply(){ return inert; }
});
const context = {
  console, structuredClone, setTimeout, clearTimeout, URL, Blob,
  document:{querySelector:()=>inert, querySelectorAll:()=>[], createElement:()=>inert, body:inert},
  window:{addEventListener(){}},
  navigator:{onLine:true, storage:{}},
  indexedDB:inert,
  confirm:()=>true,
  globalThis:null
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, {filename:"index.html"});
const api = context.__curatorTest;

let passed = 0;
function test(name, fn){
  try{ fn(); passed += 1; console.log(`PASS ${name}`); }
  catch(err){ console.error(`FAIL ${name}\n  ${err.stack || err}`); process.exitCode = 1; }
}
function assert(value, message){ if(!value) throw new Error(message || "assertion failed"); }
function rejects(fn, pattern){
  let error;
  try{ fn(); }catch(err){ error = err; }
  assert(error, "expected rejection");
  if(pattern) assert(pattern.test(error.message), `unexpected error: ${error.message}`);
}
function proposal(id, extra={}){
  return {
    proposalId:id, field:"Type", label:"Type", lane:"high", confidence:0.9,
    currentValue:"old", proposedValue:id, isIdentity:false,
    dependsOnIdentity:false, competingGroup:null, evidence:[], sources:[], ...extra
  };
}
function location(id, proposals){
  return {recordId:id, name:id, country:"", type:"", images:[], proposals};
}
function bundle(locations){
  return {schemaVersion:"scribe.mobile.v1", batchId:"test", sourceFingerprint:"sha256:test", locations};
}

test("prototype-shaped IDs are safe state keys", () => {
  const input = bundle([location("constructor", [proposal("__proto__"), proposal("constructor", {field:"Tags", label:"Tags"}), proposal("toString", {field:"Dates", label:"Dates"})])]);
  api.validateBundle(input, {skipSizeConfirm:true});
  const state = api.freshState(input);
  assert(Object.getPrototypeOf(state.toggles) === null, "toggles retained a prototype");
  assert(Object.keys(state.toggles).length === 3, "special keys were lost");
  assert(state.toggles.__proto__ === true && state.toggles.constructor === true && state.toggles.toString === true);
});

test("competing group keys cannot collide on delimiters", () => {
  const a = location("a::b", [proposal("a1", {competingGroup:"c"}), proposal("a2", {competingGroup:"c"})]);
  const b = location("a", [proposal("b1", {competingGroup:"b::c"}), proposal("b2", {competingGroup:"b::c"})]);
  const input = bundle([a,b]);
  api.validateBundle(input, {skipSizeConfirm:true});
  assert(api.competingGroupKey(a,a.proposals[0]) !== api.competingGroupKey(b,b.proposals[0]));
});

test("multiple identities are rejected", () => {
  const input = bundle([location("r", [proposal("i1", {isIdentity:true}), proposal("i2", {isIdentity:true})])]);
  rejects(() => api.validateBundle(input, {skipSizeConfirm:true}), /multiple identity/);
});

test("nested malformed fields are rejected", () => {
  const bad = bundle([location("r", [proposal("p", {confidence:1.2, evidence:"not-array", sources:{}, isIdentity:"yes"})])]);
  bad.locations[0].images = "not-array";
  rejects(() => api.validateBundle(bad, {skipSizeConfirm:true}), /images must be an array.*confidence must be between 0 and 1.*isIdentity must be boolean.*evidence must be an array.*sources must be an array/);
});

test("all-low competing groups default to Decide later", () => {
  const input = bundle([location("r", [proposal("p1", {lane:"low", confidence:0.4, competingGroup:"g"}), proposal("p2", {lane:"low", confidence:0.3, competingGroup:"g"})])]);
  api.validateBundle(input, {skipSizeConfirm:true});
  const state = api.freshState(input);
  const key = api.competingGroupKey(state.locations[0], state.locations[0].proposals[0]);
  assert(state.competingSelection[key] === "later");
  assert(state.toggles.p1 === false && state.toggles.p2 === false);
});

test("mixed groups ignore low candidates for defaults", () => {
  const input = bundle([location("r", [proposal("low", {lane:"low", confidence:0.99, competingGroup:"g"}), proposal("medium", {lane:"medium", confidence:0.5, competingGroup:"g"})])]);
  const state = api.freshState(input);
  const key = api.competingGroupKey(state.locations[0], state.locations[0].proposals[0]);
  assert(state.competingSelection[key] === "medium");
});

test("saved-state maps and integer cursor are mandatory", () => {
  const state = api.freshState(bundle([location("r", [proposal("p")])]));
  delete state.decisions;
  rejects(() => api.validateFullState(state), /decisions is missing/);
  const fractional = api.freshState(bundle([location("r", [proposal("p")])]));
  fractional.cursor = 0.5;
  rejects(() => api.validateFullState(fractional), /cursor/);
});

test("saved counts must equal reviewed outcomes", () => {
  const state = api.freshState(bundle([location("r", [proposal("p")])]));
  state.counts.accepted = 7;
  rejects(() => api.validateFullState(state), /counts.accepted/);
});

test("foreign competing selections are rejected", () => {
  const state = api.freshState(bundle([location("r", [proposal("p1", {competingGroup:"g"}), proposal("p2", {competingGroup:"g"})])]));
  const key = Object.keys(state.competingSelection)[0];
  state.competingSelection[key] = "foreign";
  rejects(() => api.validateFullState(state), /not a member/);
});

test("review decisions are recomputed and cross-checked", () => {
  const state = api.freshState(bundle([location("r", [proposal("p")])]));
  state.cursor = 1;
  state.cardOutcomes.r = "accepted";
  state.counts.accepted = 1;
  state.decisions.p = {decision:"accepted", timestamp:new Date().toISOString()};
  api.validateFullState(state);
  state.decisions.p = {decision:"rejected", timestamp:new Date().toISOString()};
  rejects(() => api.validateFullState(state), /inconsistent \(expected accepted\)/);
});

if(!process.exitCode) console.log(`\n${passed} logic regression tests passed.`);
