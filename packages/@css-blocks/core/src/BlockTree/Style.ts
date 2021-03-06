import { Attr } from "@opticss/element-analysis";

import { ResolvedConfiguration } from "../configuration";

import { AnyNode, Inheritable } from "./Inheritable";
import { RulesetContainer } from "./RulesetContainer";
export { RulesetContainer, Resolution, Ruleset } from "./RulesetContainer";

const NO_STYLE_ALIASES = new Set<string>();

/**
 * Abstract class that serves as the base for all Styles. Contains basic
 * properties and abstract methods that extenders must implement.
 */
/* tslint:disable:prefer-unknown-to-any */

export abstract class Style<
  Self extends Style<Self, Root, Parent, Child, Token>,
  Root extends Inheritable<any, Root, never, AnyNode, any> | Self,
  Parent extends Inheritable<any, Root, AnyNode | null, Self, any> | null,
  Child extends Inheritable<any, Root, Self, AnyNode | never, any> | never,
  Token extends any = string,
> extends Inheritable<Self, Root, Parent, Child> {
/* tslint:enable:prefer-unknown-to-any */

  /** cache of resolveStyles() */
  private _resolvedStyles: Set<Self> | undefined;

  /** cache of all style aliases */
  private _styleAliases: Set<string> | undefined;

  // tslint:disable-next-line:prefer-unknown-to-any
  public abstract readonly rulesets: RulesetContainer<any>;

  /**
   * Save name, parent container, and create the PropertyContainer for this data object.
   */
  constructor(name: string, parent?: Parent) {
    super(name, parent);
  }

  /**
   * Return the css selector for this `Style`.
   * @param config Option hash configuring output mode.
   * @returns The CSS class.
   */
  public abstract cssClass(config: ResolvedConfiguration, reservedClassNames: Set<string>): string;

  /**
   * Return the source selector this `Style` was read from.
   * @param scope  Optional scope to resolve this name relative to. If `true`, return the Block name instead of `:scope`. If a Block object, return with the local name instead of `:scope`.
   * @returns The source selector.
   */
  public abstract asSource(scope?: Root | boolean): string;

  /**
   * Return an attribute for analysis using the authored source syntax.
   */
  public abstract asSourceAttributes(): Attr[];

  /**
   * Returns all the classes needed to represent this block object
   * including inherited classes.
   * @returns this object's css class and all inherited classes.
   */
  cssClasses(config: ResolvedConfiguration, reservedClassNames: Set<string>): string[] {
    let classes: string[] = [];
    for (let style of this.resolveStyles()) {
        classes.push(style.cssClass(config, reservedClassNames));
      }
    return classes;
  }

  /**
   * Returns all the classes needed to represent this block object
   * including inherited classes and block aliases.
   * @returns this object's css class and all inherited classes.
   */
  public cssClassesWithAliases(config: ResolvedConfiguration, reservedClassNames: Set<string>): Set<string> {
    let classes = new Set<string>();
    for (let style of this.resolveStyles()) {
      classes = new Set([...classes, style.cssClass(config, reservedClassNames)]);
      // if this has a set of style aliases, push those too
      classes = new Set([...classes, ...style.getStyleAliases()]);
    }
    return classes;
  }

  /**
   * Adds a set of aliases to the to this object
   */
  public setStyleAliases(aliases: Set<string>): void {
    this._styleAliases = aliases;
  }

  /**
   * Returns the alisses on this object
   */
  public getStyleAliases(): Set<string> {
    return this._styleAliases || NO_STYLE_ALIASES;
  }

  /**
   * Return all Block Objects that are implied by this object.
   * This takes inheritance, attr/class correlations, and any
   * other declared links between styles into account.
   *
   * This Block Object itself is included in the returned result
   * so the resolved value's size is always 1 or greater.
   */
  public resolveStyles(): Set<Self> {
    if (this._resolvedStyles) {
      return new Set(this._resolvedStyles);
    }

    let inheritedStyles = this.resolveInheritance();
    this._resolvedStyles = new Set(inheritedStyles);
    this._resolvedStyles.add(this.asSelf());
    return new Set(this._resolvedStyles);
  }

  /**
   * Debug utility to help log Styles
   * @param config  Options for rendering cssClass.
   * @returns A debug string.
   */
  asDebug(config: ResolvedConfiguration) {
    // NOTE: debug statements don't take into account the reservedClassNames as
    // debug happens during parse and we can only get the entire list of
    // reservedClassNames once block parsing is complete
    const classes = [...this.cssClasses(config, new Set())].join(".");
    const aliases = this.getStyleAliases();
    return `${this.asSource()}${classes ? ` (.${classes}` : ""}${aliases.size ? `, aliases: .${[...aliases].join(" .")}` : ""}${classes || aliases ? ")" : ""}`;
  }
}
