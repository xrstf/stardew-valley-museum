var LOCATIONS = [];

for (var k in DB.locations) {
	LOCATIONS.push(k);
}

function handleFileSelect(evt) {
	var file = evt.target.files[0];

	function nsResolver(prefix) {
		return prefix == 'xsi' ? 'http://www.w3.org/2001/XMLSchema-instance' : null;
	}

	var reader = new FileReader();
	reader.onload = function(e) {
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(e.target.result, 'text/xml');

		if (xmlDoc.documentElement.nodeName !== 'SaveGame') {
			console.log('Not a Stardew Valley savestate.');
			return;
		}

		var museumItems = xmlDoc.evaluate('/SaveGame/locations/GameLocation[@xsi:type="LibraryMuseum"]/museumPieces/item/value/int', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null);
		var currentItem = museumItems.iterateNext();

		var itemIDs = [];

		while (currentItem) {
			itemIDs.push(parseInt(currentItem.textContent, 10));
			currentItem = museumItems.iterateNext();
		}

		renderChecklist(itemIDs);
	};

	reader.readAsText(file);
}

$('#file-select').on('change', handleFileSelect);

function joinList(values, fallback, glue) {
	if (!glue) {
		glue = ' or ';
	}

	switch (values.length) {
		case 0:
			return fallback;

		case 1:
			return values[0];

		default:
			var last = values.pop();
			return values.join(', ') + glue + last;
	}
}

function wikiLink(key, text, props) {
	var ident = props && props.wiki ? props.wiki : key;

	return '<a href="http://stardewvalleywiki.com/' + ident + '" target="_blank">' + text + '</a>';
}

function locationListString(locations) {
	var values = [];

	if (locations) {
		for (var i = 0; i < locations.length; ++i) {
			var key    = locations[i];
			var props  = DB.locations[key];
			var name   = props && props.name   ? props.name   : ('[' + key + ']');
			var prefix = props && props.prefix ? props.prefix : 'in';
			var markup = prefix + ' ' + wikiLink(key, name, props);

			values.push(markup);
		}
	}

	return joinList(values, 'anywhere');
}

function enemyListString(enemies) {
	var values = [];

	if (enemies) {
		for (var i = 0; i < enemies.length; ++i) {
			var key    = enemies[i];
			var props  = DB.enemies[key];
			var name   = props ? props.plural : ('[' + key + ']');
			var markup = wikiLink(key, '<span class="enemy" style="background-image:url(/images/' + key + '.png)">' + name + '</span>', props);

			values.push(markup);
		}
	}

	return joinList(values, 'any enemy');
}

function animalListString(animals) {
	var values = [];

	if (animals) {
		for (var i = 0; i < animals.length; ++i) {
			var key    = animals[i];
			var props  = DB.animals[key];
			var name   = props ? props.plural : ('[' + key + ']');
			var markup = wikiLink(key, '<span class="animal" style="background-image:url(/images/' + key + '.png)">' + name + '</span>', props);

			values.push(markup);
		}
	}

	return joinList(values, 'any animal', ' and ');
}

function geodeListString(geodes) {
	var values = [];

	if (geodes) {
		for (var i = 0; i < geodes.length; ++i) {
			var key    = geodes[i];
			var props  = DB.geodes[key];
			var name   = props ? props.plural : ('[' + key + ']');
			var markup = wikiLink(key, '<span class="geode" style="background-image:url(/images/' + key + '.png)">' + name + '</span>', props);

			values.push(markup);
		}
	}

	return joinList(values, 'any geodes', ' and ');
}

function nodeListString(nodes) {
	var values = [];

	if (nodes) {
		for (var i = 0; i < nodes.length; ++i) {
			var key    = nodes[i];
			var props  = DB.nodes[key];
			var name   = props ? props.plural : ('[' + key + ']');
			var markup = wikiLink('Mining#Mining_Nodes', '<span class="node" style="background-image:url(/images/' + key + '.png)">' + name + '</span>');

			values.push(markup);
		}
	}

	return joinList(values, 'any nodes', ' and ');
}

function renderChecklist(completedItems) {
	var counter = 0;
	var completedCount = 0;
	var whereToGo = {};

	$('.checklist > li').remove();

	for (var itemIdentifier in DB.items) {
		var itemInfos = DB.items[itemIdentifier];
		var completed = completedItems === null ? null : completedItems.indexOf(itemInfos.id) !== -1;
		var container = $('#col' + Math.floor(counter / 19));

		var className = 'undefined';

		if (completed === true) {
			className = 'completed';
			completedCount++;
		}
		else if (completed === false) {
			className = 'todo';

			for (var infoKey in itemInfos.rules) {
				var rules = itemInfos.rules[infoKey];

				for (var i = 0; i < rules.length; ++i) {
					var rule = rules[i];
					var locs = ('in' in rule) ? rule.in : LOCATIONS;

					for (var j = 0; j < locs.length; ++j) {
						var loc = locs[j];

						if (!(loc in whereToGo)) {
							whereToGo[loc] = {
								counter: 0,
								items: [],
							};
						}

						whereToGo[loc].counter++;

						if (whereToGo[loc].items.indexOf(itemIdentifier) === -1) {
							whereToGo[loc].items.push(itemIdentifier);
						}
					}
				}
			}
		}

		container.append($(
			'<li data-id="' + itemIdentifier + '" class="tooltip item-' + className + '" title="Foo">' +
				'<div class="icon">' +
					'<img src="/images/' + itemIdentifier + '.png">' +
				'</div>' +
				'<div class="name">' +
					'' + (itemInfos.name || itemIdentifier) + '' +
				'</div>' +
			'</li>'));

		counter++;
	}

	if (completedItems !== null) {
		$('body').removeClass('no-file');
		$('#completed-items-count').text(completedCount);
	}

	Tipped.create('.tooltip', function(element) {
		var tpl    = $('#tooltip-template').clone();
		var itemID = $(element).data('id');
		var item   = DB.items[itemID];

		tpl.find('.title').html(wikiLink(itemID, item.name || itemID, item));
		tpl.find('.icon img').attr('src', '/images/' + itemID + '.png');

		var rulesContainer = tpl.find('ul');

		for (var activityKey in item.rules) {
			var activities = item.rules[activityKey];

			for (var i = 0; i < activities.length; ++i) {
				var activity = activities[i];
				var markup     = null;

				switch (activityKey) {
					case 'dig':
						markup = 'digging ' + locationListString(activity.in);
						break;

					case 'kill':
						markup = 'killing ' + enemyListString(activity.die) + ' ' + locationListString(activity.in);
						break;

					case 'fish':
						markup = 'fishing for Treasure Chests';
						break;

					case 'animal':
						markup = 'raising ' + animalListString(activity.what);
						break;

					case 'geode':
						markup = 'opening ' + geodeListString(activity.kind);
						break;

					case 'mine':
						markup = 'mining for ' + nodeListString(activity.what);
						break;

					case 'pan':
						markup = 'panning in rivers and lakes';
						break;

					case 'garbage':
						markup = 'digging through garbage cans';
						break;

					case 'forage':
						markup = 'foraging ' + locationListString(activity.in);
						break;

					case 'spots':
						markup = 'digging up artifact spots ' + locationListString(activity.in);
						break;
				}

				if (markup) {
					rulesContainer.append($('<li class="activity-' + activityKey + '">' + markup + '.</li>'));
				}
			}
		}

		return tpl.html();
	}, {
		position: 'leftbottom',
		fadeIn: 100,
		fadeOut: 100,
		size: 'large',
		padding: false,
	});
}

renderChecklist(null);
