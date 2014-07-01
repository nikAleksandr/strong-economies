strong-economies
================

Strong Economies, Resilient Counties Interactive Map

================

This map uses a D3 generated map and D3 data filters to efficiently filter among several svg circle objects on the map.

The filter has an OR functionality within each category of filters and an AND functionality between filter groups so that selecting "workforce development" and "Infrastructure Investment" displays any objects that meet both conditions, whereas adding a filter for "medium-sized" population will limit the selection to those that are both medium-sized AND among the selected economic development types.

The filter can be expanded to use any number of cross-filters by adding another layer of nested while loops and passing in a new "selected" items array.

