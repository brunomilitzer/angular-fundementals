import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';

import { RecipeService } from '../recipe.service';
import { Recipe } from '../recipe.model';
import * as fromApp from '../../store/app.reducer';
import { map } from 'rxjs/operators';

@Component( {
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.component.html',
  styleUrls: [ './recipe-edit.component.css' ]
} )
export class RecipeEditComponent implements OnInit {
  id: number;
  editMode = false;
  recipeForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private router: Router,
    private store: Store<fromApp.AppState> ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(
      ( params: Params ) => {
        this.id = +params.id;
        this.editMode = params.id != null;
        this.initForm();
      }
    );
  }

  onSubmit(): void {
    const newRecipe = new Recipe(
      this.recipeForm.value.name,
      this.recipeForm.value.description,
      this.recipeForm.value.imagePath,
      this.recipeForm.value.ingredients
    );

    if ( this.editMode ) {
      this.store.select( 'recipes' ).pipe(
        map( recipeState => {
          return recipeState.recipes.find( ( recipe, index ) => {
            return index === this.id;
          } );
        } )
      );
    } else {
      this.recipeService.addRecipe( newRecipe );
    }
    this.onCancel();
  }

  onAddIngredient(): void {
    (this.recipeForm.get( 'ingredients' ) as FormArray).push(
      new FormGroup( {
        name: new FormControl(),
        amount: new FormControl( null, [
          Validators.required, Validators.pattern( /^[1-9]+[0+9]*$/ )
        ] )
      } )
    );
  }

  onCancel(): void {
    this.router.navigate( [ '../' ], { relativeTo: this.route } );
  }

  onDeleteIngredient( index: number ): void {
    (this.recipeForm.get( 'ingredients' ) as FormArray).removeAt( index );
  }

  trackByFn( index: any, item: any ): any {
    return index;
  }

  private initForm(): void {
    let recipeName = '';
    let recipeImagePath = '';
    let recipeDescription = '';
    const recipeIngredients = new FormArray( [] );

    if ( this.editMode ) {
      this.store.select( 'recipes' ).pipe(
        map( recipeState => {
          return recipeState.recipes.find( ( recipe, index ) => {
            return index === this.id;
          } );
        } )
      ).subscribe( recipe => {
        recipeName = recipe.name;
        recipeImagePath = recipe.imagePath;
        recipeDescription = recipe.description;

        if ( recipe.ingredients ) {
          for ( const ingredient of recipe.ingredients ) {
            recipeIngredients.push(
              new FormGroup( {
                name: new FormControl( ingredient.name, Validators.required ),
                amount: new FormControl( ingredient.amount, [
                  Validators.required, Validators.pattern( /^[1-9]+[0+9]*$/ )
                ] )
              } )
            );
          }
        }
      } );
    }

    this.recipeForm = new FormGroup( {
      name: new FormControl( recipeName, Validators.required ),
      imagePath: new FormControl( recipeImagePath, Validators.required ),
      description: new FormControl( recipeDescription, Validators.required ),
      ingredients: recipeIngredients
    } );
  }
}
