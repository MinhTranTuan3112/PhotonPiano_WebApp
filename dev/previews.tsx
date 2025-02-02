import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import CreateEntranceTestPage from "~/routes/staff.entrance-tests.create";
import RoomsCombobox from "~/components/room/rooms-combobox";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/CreateEntranceTestPage">
                <CreateEntranceTestPage/>
            </ComponentPreview>
            <ComponentPreview path="/RoomsCombobox">
                <RoomsCombobox/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;